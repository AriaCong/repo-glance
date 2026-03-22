const MAX_README_LENGTH = 10_000;

export function truncateReadme(readme: string, maxLength: number): string {
  if (readme.length <= maxLength) {
    return readme;
  }

  const truncated = readme.slice(0, maxLength);
  const lastParagraphBreak = truncated.lastIndexOf("\n\n");

  if (lastParagraphBreak > maxLength * 0.5) {
    return truncated.slice(0, lastParagraphBreak) + "\n\n[...truncated]";
  }

  return truncated + "\n\n[...truncated]";
}

export function buildPrompt(
  readme: string | null,
  tree: string[],
  configFiles: Map<string, string>
): string {
  const sections: string[] = [];

  sections.push(
    "You are summarizing a GitHub repository for a developer. Analyze the following repository data and provide a concise summary."
  );

  // README section
  if (readme) {
    const truncatedReadme = truncateReadme(readme, MAX_README_LENGTH);
    sections.push(`## README\n\n${truncatedReadme}`);
  } else {
    sections.push(
      "## README\n\nNo README available for this repository."
    );
  }

  // File tree section
  if (tree.length > 0) {
    sections.push(`## File Tree (top 2 levels)\n\n${tree.join("\n")}`);
  }

  // Config files section
  if (configFiles.size > 0) {
    const configEntries: string[] = [];
    for (const [filename, content] of configFiles) {
      configEntries.push(`### ${filename}\n\`\`\`\n${content}\n\`\`\``);
    }
    sections.push(`## Config Files\n\n${configEntries.join("\n\n")}`);
  }

  // Instructions
  sections.push(
    `## Instructions\n\nRespond with exactly four sections using these headers:\n\n## What It Is\n## Tech Stack\n## Getting Started\n## Key Concepts\n\nKeep each section concise (2-4 bullet points or sentences). Focus on what a developer needs to know to quickly understand and start working with this repo.`
  );

  return sections.join("\n\n---\n\n");
}
