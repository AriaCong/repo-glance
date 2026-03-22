import type { Summary } from "../types";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;

export class ClaudeApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ClaudeApiError";
  }
}

export async function sendPrompt(
  apiKey: string,
  prompt: string
): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new ClaudeApiError(
      response.status,
      `Claude API error (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === "text"
  );
  return textBlock?.text ?? "";
}

export function parseResponse(text: string): Summary {
  const sections = {
    whatItIs: "",
    techStack: "",
    gettingStarted: "",
    keyConcepts: "",
  };

  const headerMap: Array<{ header: string; key: keyof Summary }> = [
    { header: "## What It Is", key: "whatItIs" },
    { header: "## Tech Stack", key: "techStack" },
    { header: "## Getting Started", key: "gettingStarted" },
    { header: "## Key Concepts", key: "keyConcepts" },
  ];

  // Check if any expected headers exist
  const hasHeaders = headerMap.some(({ header }) => text.includes(header));

  if (!hasHeaders) {
    // Fallback: return entire text as whatItIs
    return {
      whatItIs: text.trim(),
      techStack: "",
      gettingStarted: "",
      keyConcepts: "",
    };
  }

  for (let i = 0; i < headerMap.length; i++) {
    const { header, key } = headerMap[i];
    const startIdx = text.indexOf(header);
    if (startIdx === -1) continue;

    const contentStart = startIdx + header.length;

    // Find the next header or end of text
    let endIdx = text.length;
    for (let j = i + 1; j < headerMap.length; j++) {
      const nextIdx = text.indexOf(headerMap[j].header);
      if (nextIdx !== -1) {
        endIdx = nextIdx;
        break;
      }
    }

    sections[key] = text.slice(contentStart, endIdx).trim();
  }

  return sections;
}

export async function generateSummary(
  apiKey: string,
  prompt: string
): Promise<Summary> {
  const responseText = await sendPrompt(apiKey, prompt);
  return parseResponse(responseText);
}
