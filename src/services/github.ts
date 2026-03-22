export class GitHubApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: "RATE_LIMITED" | "PRIVATE_REPO" | "UNKNOWN",
    message: string
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

async function githubFetch(
  path: string,
  token?: string
): Promise<globalThis.Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const response = await fetch(`https://api.github.com${path}`, { headers });

  if (response.status === 403) {
    const remaining = response.headers.get("X-RateLimit-Remaining");
    if (remaining === "0") {
      throw new GitHubApiError(
        403,
        "RATE_LIMITED",
        "GitHub API rate limit exceeded. Add a GitHub token in settings."
      );
    }
  }

  if (response.status === 404) {
    throw new GitHubApiError(
      404,
      "PRIVATE_REPO",
      "Repository not found. It may be private — add a GitHub token in settings."
    );
  }

  if (!response.ok) {
    throw new GitHubApiError(
      response.status,
      "UNKNOWN",
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  return response;
}

export async function fetchDefaultBranch(
  owner: string,
  repo: string,
  token?: string
): Promise<{ defaultBranch: string; sha: string }> {
  const response = await githubFetch(`/repos/${owner}/${repo}`, token);
  const data = await response.json();
  return {
    defaultBranch: data.default_branch,
    sha: data.default_branch, // Will be resolved to actual SHA via tree endpoint
  };
}

export async function fetchReadme(
  owner: string,
  repo: string,
  token?: string
): Promise<string | null> {
  try {
    const response = await githubFetch(
      `/repos/${owner}/${repo}/readme`,
      token
    );
    const data = await response.json();
    return atob(data.content.replace(/\n/g, ""));
  } catch (error) {
    if (error instanceof GitHubApiError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchTree(
  owner: string,
  repo: string,
  sha: string,
  token?: string
): Promise<string[]> {
  const response = await githubFetch(
    `/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    token
  );
  const data = await response.json();
  const paths: string[] = data.tree
    .map((item: { path: string }) => item.path)
    .filter((path: string) => {
      const depth = path.split("/").length;
      return depth <= 2;
    });
  return paths;
}

const KNOWN_CONFIG_FILES = [
  "package.json",
  "Cargo.toml",
  "pyproject.toml",
  "go.mod",
  "Gemfile",
  "pom.xml",
  "build.gradle",
  "composer.json",
  "requirements.txt",
  "tsconfig.json",
];

export async function fetchConfigFiles(
  owner: string,
  repo: string,
  tree: string[],
  token?: string
): Promise<Map<string, string>> {
  const configFiles = new Map<string, string>();
  const matches = tree.filter((path) =>
    KNOWN_CONFIG_FILES.includes(path.split("/").pop() ?? "")
  );

  const toFetch = matches.slice(0, 10);

  const results = await Promise.allSettled(
    toFetch.map(async (path) => {
      const response = await githubFetch(
        `/repos/${owner}/${repo}/contents/${path}`,
        token
      );
      const data = await response.json();
      const content = atob(data.content.replace(/\n/g, ""));
      return { path, content };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      configFiles.set(result.value.path, result.value.content);
    }
  }

  return configFiles;
}
