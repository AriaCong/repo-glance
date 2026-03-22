import {
  fetchDefaultBranch,
  fetchReadme,
  fetchTree,
  fetchConfigFiles,
  GitHubApiError,
} from "../../src/services/github";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function mockResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

describe("fetchDefaultBranch", () => {
  it("returns branch name and sha", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ default_branch: "main" })
    );

    const result = await fetchDefaultBranch("owner", "repo");
    expect(result.defaultBranch).toBe("main");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github.v3+json",
        }),
      })
    );
  });

  it("includes auth header when token provided", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ default_branch: "main" })
    );

    await fetchDefaultBranch("owner", "repo", "my-token");
    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders["Authorization"]).toBe("token my-token");
  });
});

describe("fetchReadme", () => {
  it("returns decoded base64 content", async () => {
    const content = btoa("# Hello World");
    mockFetch.mockResolvedValueOnce(mockResponse({ content }));

    const result = await fetchReadme("owner", "repo");
    expect(result).toBe("# Hello World");
  });

  it("returns null on 404", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({}, 404)
    );

    const result = await fetchReadme("owner", "repo");
    expect(result).toBeNull();
  });
});

describe("fetchTree", () => {
  it("filters to top 2 directory levels", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        tree: [
          { path: "README.md" },
          { path: "src" },
          { path: "src/index.ts" },
          { path: "src/utils/helper.ts" },
          { path: "src/utils/deep/nested.ts" },
        ],
      })
    );

    const result = await fetchTree("owner", "repo", "abc123");
    expect(result).toEqual([
      "README.md",
      "src",
      "src/index.ts",
    ]);
    expect(result).not.toContain("src/utils/helper.ts");
    expect(result).not.toContain("src/utils/deep/nested.ts");
  });
});

describe("fetchConfigFiles", () => {
  it("detects and fetches known config files", async () => {
    const tree = ["package.json", "src/index.ts", "tsconfig.json", "README.md"];

    mockFetch
      .mockResolvedValueOnce(mockResponse({ content: btoa('{"name":"test"}') }))
      .mockResolvedValueOnce(mockResponse({ content: btoa('{"strict":true}') }));

    const result = await fetchConfigFiles("owner", "repo", tree);
    expect(result.size).toBe(2);
    expect(result.get("package.json")).toBe('{"name":"test"}');
    expect(result.get("tsconfig.json")).toBe('{"strict":true}');
  });

  it("caps at 10 config files", async () => {
    const tree = Array.from({ length: 15 }, (_, i) => `config${i}.json`);
    // Only known config filenames are fetched — this should result in 0
    const result = await fetchConfigFiles("owner", "repo", tree);
    expect(result.size).toBe(0);
  });
});

describe("rate limit handling", () => {
  it("throws GitHubApiError on 403 with rate limit header", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({}, 403, { "X-RateLimit-Remaining": "0" })
    );

    await expect(fetchDefaultBranch("owner", "repo")).rejects.toThrow(
      GitHubApiError
    );
  });
});

describe("private repo handling", () => {
  it("throws GitHubApiError on 404", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 404));

    await expect(fetchDefaultBranch("owner", "repo")).rejects.toThrow(
      GitHubApiError
    );
  });
});
