// --- Repo Context ---

export interface RepoContext {
  owner: string;
  repo: string;
}

// --- Summary ---

export interface Summary {
  whatItIs: string;
  techStack: string;
  gettingStarted: string;
  keyConcepts: string;
}

// --- Cache ---

export interface CacheEntry {
  summary: Summary;
  sha: string;
  timestamp: number;
}

// --- Error Codes ---

export type ErrorCode =
  | "NO_API_KEY"
  | "RATE_LIMITED"
  | "PRIVATE_REPO"
  | "CLAUDE_ERROR"
  | "UNKNOWN";

// --- Messages (Content Script → Background Worker) ---

export interface SummarizeMessage {
  type: "SUMMARIZE";
  owner: string;
  repo: string;
}

export type Message = SummarizeMessage;

// --- Responses (Background Worker → Content Script) ---

export interface SummaryResultResponse {
  type: "SUMMARY_RESULT";
  summary: Summary;
}

export interface SummaryErrorResponse {
  type: "SUMMARY_ERROR";
  error: {
    code: ErrorCode;
    message: string;
  };
}

export interface SummaryLoadingResponse {
  type: "SUMMARY_LOADING";
  status: string;
}

export type Response =
  | SummaryResultResponse
  | SummaryErrorResponse
  | SummaryLoadingResponse;

// --- Storage Keys ---

export const STORAGE_KEYS = {
  claudeApiKey: "claudeApiKey",
  githubToken: "githubToken",
} as const;
