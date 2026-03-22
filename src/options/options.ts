import { STORAGE_KEYS } from "../types";

const form = document.getElementById("settings-form") as HTMLFormElement;
const claudeInput = document.getElementById("claude-api-key") as HTMLInputElement;
const githubInput = document.getElementById("github-token") as HTMLInputElement;
const statusMessage = document.getElementById("status-message") as HTMLParagraphElement;

// Load saved values on page load
chrome.storage.sync.get(
  [STORAGE_KEYS.claudeApiKey, STORAGE_KEYS.githubToken],
  (result) => {
    if (result[STORAGE_KEYS.claudeApiKey]) {
      claudeInput.value = result[STORAGE_KEYS.claudeApiKey] as string;
    }
    if (result[STORAGE_KEYS.githubToken]) {
      githubInput.value = result[STORAGE_KEYS.githubToken] as string;
    }
  }
);

// Save on form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const claudeApiKey = claudeInput.value.trim();
  if (!claudeApiKey) {
    showStatus("Claude API key is required.", true);
    return;
  }

  const data: Record<string, string> = {
    [STORAGE_KEYS.claudeApiKey]: claudeApiKey,
  };

  const githubToken = githubInput.value.trim();
  if (githubToken) {
    data[STORAGE_KEYS.githubToken] = githubToken;
  }

  chrome.storage.sync.set(data, () => {
    showStatus("Settings saved successfully.");
  });
});

// Show/hide toggle for password fields
document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = (btn as HTMLButtonElement).dataset.target;
    if (!targetId) return;
    const input = document.getElementById(targetId) as HTMLInputElement;
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "Hide";
    } else {
      input.type = "password";
      btn.textContent = "Show";
    }
  });
});

function showStatus(message: string, isError = false): void {
  statusMessage.textContent = message;
  statusMessage.hidden = false;
  statusMessage.className = isError
    ? "status-message error"
    : "status-message success";
  setTimeout(() => {
    statusMessage.hidden = true;
  }, 3000);
}
