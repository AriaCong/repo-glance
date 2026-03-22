import type { RepoContext, Response } from "./types";

// Non-repo GitHub paths to exclude
const EXCLUDED_PATHS = new Set([
  "settings",
  "explore",
  "notifications",
  "new",
  "login",
  "signup",
  "marketplace",
  "sponsors",
  "codespaces",
  "issues",
  "pulls",
  "discussions",
  "search",
  "trending",
  "collections",
  "events",
  "stars",
  "topics",
]);

export function parseRepoUrl(url: string): RepoContext | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;

    const parts = parsed.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const [owner, repo] = parts;
    if (EXCLUDED_PATHS.has(owner)) return null;

    return { owner, repo };
  } catch {
    return null;
  }
}

let sidebarVisible = false;

// Listen for messages from background worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_SIDEBAR") {
    toggleSidebar();
  } else if (
    message.type === "SUMMARY_RESULT" ||
    message.type === "SUMMARY_ERROR" ||
    message.type === "SUMMARY_LOADING"
  ) {
    handleResponse(message as Response);
  }
});

function toggleSidebar(): void {
  sidebarVisible = !sidebarVisible;

  // Dispatch custom event for sidebar component to handle
  window.dispatchEvent(
    new CustomEvent("repoglance:toggle", { detail: { visible: sidebarVisible } })
  );

  if (sidebarVisible) {
    const context = parseRepoUrl(window.location.href);
    if (context) {
      requestSummary(context.owner, context.repo);
    }
  }
}

function requestSummary(owner: string, repo: string): void {
  chrome.runtime.sendMessage({ type: "SUMMARIZE", owner, repo });
}

function handleResponse(response: Response): void {
  window.dispatchEvent(
    new CustomEvent("repoglance:response", { detail: response })
  );
}

// Handle GitHub SPA navigation
let lastUrl = window.location.href;

function onNavigate(): void {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Close sidebar on navigation
    if (sidebarVisible) {
      sidebarVisible = false;
      window.dispatchEvent(
        new CustomEvent("repoglance:toggle", { detail: { visible: false } })
      );
    }
  }
}

// GitHub uses Turbo for SPA navigation
document.addEventListener("turbo:load", onNavigate);
window.addEventListener("popstate", onNavigate);
