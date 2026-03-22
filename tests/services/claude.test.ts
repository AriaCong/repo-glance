import { parseResponse } from "../../src/services/claude";

describe("parseResponse", () => {
  it("correctly splits well-formatted response into 4 sections", () => {
    const text = `## What It Is
A web framework for building APIs.

## Tech Stack
- Node.js
- TypeScript

## Getting Started
1. Clone the repo
2. Run npm install

## Key Concepts
- Middleware pipeline
- Route handlers`;

    const result = parseResponse(text);
    expect(result.whatItIs).toContain("web framework");
    expect(result.techStack).toContain("Node.js");
    expect(result.gettingStarted).toContain("Clone the repo");
    expect(result.keyConcepts).toContain("Middleware pipeline");
  });

  it("falls back to raw text when headers are missing", () => {
    const text = "This is just plain text without any headers.";
    const result = parseResponse(text);
    expect(result.whatItIs).toBe(text);
    expect(result.techStack).toBe("");
    expect(result.gettingStarted).toBe("");
    expect(result.keyConcepts).toBe("");
  });

  it("handles partial headers", () => {
    const text = `## What It Is
A tool for developers.

## Tech Stack
- Python

Some text without the remaining headers.`;

    const result = parseResponse(text);
    expect(result.whatItIs).toContain("tool for developers");
    expect(result.techStack).toContain("Python");
    expect(result.gettingStarted).toBe("");
    expect(result.keyConcepts).toBe("");
  });

  it("handles empty sections", () => {
    const text = `## What It Is

## Tech Stack
JavaScript
## Getting Started

## Key Concepts
Components`;

    const result = parseResponse(text);
    expect(result.whatItIs).toBe("");
    expect(result.techStack).toBe("JavaScript");
    expect(result.gettingStarted).toBe("");
    expect(result.keyConcepts).toBe("Components");
  });
});
