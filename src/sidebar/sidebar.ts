import type { Summary, ErrorCode, Response } from "../types";
import sidebarStyles from "./sidebar.css?inline";

let shadowRoot: ShadowRoot | null = null;
let sidebarEl: HTMLDivElement | null = null;

function ensureSidebar(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  const host = document.createElement("div");
  host.id = "repoglance-host";
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = sidebarStyles;
  shadowRoot.appendChild(style);

  sidebarEl = document.createElement("div");
  sidebarEl.className = "sidebar";
  sidebarEl.innerHTML = `
    <div class="sidebar-header">
      <h2>RepoGlance</h2>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="sidebar-content"></div>
  `;
  shadowRoot.appendChild(sidebarEl);

  // Close button
  const closeBtn = sidebarEl.querySelector(".close-btn");
  closeBtn?.addEventListener("click", () => {
    hideSidebar();
  });

  return shadowRoot;
}

function getContentEl(): HTMLDivElement | null {
  return sidebarEl?.querySelector(".sidebar-content") ?? null;
}

export function showSidebar(): void {
  ensureSidebar();
  sidebarEl?.classList.add("visible");
}

export function hideSidebar(): void {
  sidebarEl?.classList.remove("visible");
}

export function toggleSidebar(): void {
  ensureSidebar();
  if (sidebarEl?.classList.contains("visible")) {
    hideSidebar();
  } else {
    showSidebar();
  }
}

export function showLoading(status: string): void {
  const content = getContentEl();
  if (!content) return;
  content.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <span class="loading-text">${escapeHtml(status)}</span>
    </div>
  `;
}

export function showSummary(summary: Summary): void {
  const content = getContentEl();
  if (!content) return;
  content.innerHTML = `
    <div class="section">
      <h3>What It Is</h3>
      <div class="section-content">${escapeHtml(summary.whatItIs)}</div>
    </div>
    <div class="section">
      <h3>Tech Stack</h3>
      <div class="section-content">${escapeHtml(summary.techStack)}</div>
    </div>
    <div class="section">
      <h3>Getting Started</h3>
      <div class="section-content">${escapeHtml(summary.gettingStarted)}</div>
    </div>
    <div class="section">
      <h3>Key Concepts</h3>
      <div class="section-content">${escapeHtml(summary.keyConcepts)}</div>
    </div>
  `;
}

export function showError(code: ErrorCode, message: string): void {
  const content = getContentEl();
  if (!content) return;

  let buttonText: string;
  let buttonAction: string;

  switch (code) {
    case "NO_API_KEY":
      buttonText = "Open Settings";
      buttonAction = "open-settings";
      break;
    case "RATE_LIMITED":
    case "PRIVATE_REPO":
      buttonText = "Add GitHub Token";
      buttonAction = "open-settings";
      break;
    case "CLAUDE_ERROR":
    case "UNKNOWN":
    default:
      buttonText = "Retry";
      buttonAction = "retry";
      break;
  }

  content.innerHTML = `
    <div class="error">
      <div class="error-icon">&#9888;</div>
      <div class="error-message">${escapeHtml(message)}</div>
      <button class="action-btn" data-action="${buttonAction}">${escapeHtml(buttonText)}</button>
    </div>
  `;

  const btn = content.querySelector(".action-btn");
  btn?.addEventListener("click", () => {
    const action = (btn as HTMLButtonElement).dataset.action;
    if (action === "open-settings") {
      chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
    } else if (action === "retry") {
      window.dispatchEvent(new CustomEvent("repoglance:retry"));
    }
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Listen for events from content script
window.addEventListener("repoglance:toggle", ((e: CustomEvent) => {
  if (e.detail.visible) {
    showSidebar();
    showLoading("Fetching repo data...");
  } else {
    hideSidebar();
  }
}) as EventListener);

window.addEventListener("repoglance:response", ((e: CustomEvent) => {
  const response = e.detail as Response;
  switch (response.type) {
    case "SUMMARY_RESULT":
      showSummary(response.summary);
      break;
    case "SUMMARY_ERROR":
      showError(response.error.code as ErrorCode, response.error.message);
      break;
    case "SUMMARY_LOADING":
      showLoading(response.status);
      break;
  }
}) as EventListener);
