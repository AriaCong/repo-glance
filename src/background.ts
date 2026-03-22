import { STORAGE_KEYS } from "./types";
import type { ErrorCode, Response } from "./types";
import {
  fetchDefaultBranch,
  fetchReadme,
  fetchTree,
  fetchConfigFiles,
  GitHubApiError,
} from "./services/github";
import { getCachedSummary, setCachedSummary } from "./services/cache";
import { buildPrompt } from "./services/prompt";
import { generateSummary, ClaudeApiError } from "./services/claude";

// Extension icon click → toggle sidebar in active tab
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
  }
});

// Message handler for SUMMARIZE requests from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SUMMARIZE") {
    handleSummarize(message.owner, message.repo, sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleSummarize(
  owner: string,
  repo: string,
  sendResponse: (response: Response) => void
): Promise<void> {
  try {
    // Read API keys from storage
    const storage = await chrome.storage.sync.get([
      STORAGE_KEYS.claudeApiKey,
      STORAGE_KEYS.githubToken,
    ]);

    const claudeApiKey = storage[STORAGE_KEYS.claudeApiKey] as
      | string
      | undefined;
    const githubToken = storage[STORAGE_KEYS.githubToken] as
      | string
      | undefined;

    if (!claudeApiKey) {
      sendResponse({
        type: "SUMMARY_ERROR",
        error: {
          code: "NO_API_KEY",
          message: "Set up your Claude API key in the extension settings.",
        },
      });
      return;
    }

    // Fetch default branch to get SHA for cache key
    const { defaultBranch } = await fetchDefaultBranch(
      owner,
      repo,
      githubToken
    );

    // Check cache
    const cached = await getCachedSummary(owner, repo, defaultBranch);
    if (cached) {
      sendResponse({
        type: "SUMMARY_RESULT",
        summary: cached.summary,
      });
      return;
    }

    // Cache miss — fetch repo data in parallel
    const [readme, tree] = await Promise.all([
      fetchReadme(owner, repo, githubToken),
      fetchTree(owner, repo, defaultBranch, githubToken),
    ]);

    const configFiles = await fetchConfigFiles(owner, repo, tree, githubToken);

    // Build prompt and generate summary
    const prompt = buildPrompt(readme, tree, configFiles);
    const summary = await generateSummary(claudeApiKey, prompt);

    // Cache the result
    await setCachedSummary(owner, repo, defaultBranch, summary);

    sendResponse({
      type: "SUMMARY_RESULT",
      summary,
    });
  } catch (error) {
    let code: ErrorCode = "UNKNOWN";
    let message = "An unexpected error occurred.";

    if (error instanceof GitHubApiError) {
      code = error.errorCode as ErrorCode;
      message = error.message;
    } else if (error instanceof ClaudeApiError) {
      code = "CLAUDE_ERROR";
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    sendResponse({
      type: "SUMMARY_ERROR",
      error: { code, message },
    });
  }
}
