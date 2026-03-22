import { buildPrompt, truncateReadme } from "../../src/services/prompt";

describe("buildPrompt", () => {
  it("includes README content", () => {
    const prompt = buildPrompt("# My Project", ["src/index.ts"], new Map());
    expect(prompt).toContain("# My Project");
  });

  it("handles null README", () => {
    const prompt = buildPrompt(null, ["src/index.ts"], new Map());
    expect(prompt).toContain("No README available");
  });

  it("includes file tree", () => {
    const tree = ["src/index.ts", "package.json"];
    const prompt = buildPrompt("readme", tree, new Map());
    expect(prompt).toContain("src/index.ts");
    expect(prompt).toContain("package.json");
  });

  it("includes config file contents", () => {
    const configs = new Map([["package.json", '{"name":"test"}']]);
    const prompt = buildPrompt("readme", [], configs);
    expect(prompt).toContain("### package.json");
    expect(prompt).toContain('{"name":"test"}');
  });

  it("omits config section when map is empty", () => {
    const prompt = buildPrompt("readme", ["file.ts"], new Map());
    expect(prompt).not.toContain("## Config Files");
  });

  it("specifies four expected sections in instructions", () => {
    const prompt = buildPrompt("readme", [], new Map());
    expect(prompt).toContain("## What It Is");
    expect(prompt).toContain("## Tech Stack");
    expect(prompt).toContain("## Getting Started");
    expect(prompt).toContain("## Key Concepts");
  });
});

describe("truncateReadme", () => {
  it("returns text unchanged if under limit", () => {
    const text = "Short text";
    expect(truncateReadme(text, 100)).toBe(text);
  });

  it("truncates at paragraph break when over limit", () => {
    const text = "First paragraph.\n\nSecond paragraph that is longer.";
    const result = truncateReadme(text, 30);
    expect(result).toContain("First paragraph.");
    expect(result).toContain("[...truncated]");
    expect(result).not.toContain("Second paragraph");
  });

  it("truncates at limit if no paragraph break found in reasonable range", () => {
    const text = "A".repeat(200);
    const result = truncateReadme(text, 100);
    expect(result.length).toBeLessThan(200);
    expect(result).toContain("[...truncated]");
  });
});
