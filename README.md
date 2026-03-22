# RepoGlance

A Chrome extension that adds an AI-generated summary sidebar to GitHub repository pages. Click the extension icon on any repo page to get a quick overview of what the repo does, its tech stack, how to get started, and key architectural concepts.

## Features

- One-click summaries on any GitHub repo page
- Four structured sections: **What It Is**, **Tech Stack**, **Getting Started**, **Key Concepts**
- Analyzes README, file tree, and config files (package.json, Cargo.toml, pyproject.toml, go.mod, etc.)
- Caches summaries per repo + branch SHA — instant loads on repeat visits
- Shadow DOM sidebar that won't conflict with GitHub's styles
- Optional GitHub token support for higher API rate limits and private repos

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Claude API key](https://console.anthropic.com/settings/keys)

### Build from Source

```bash
git clone https://github.com/AriaCong/repo-glance.git
cd repo-glance
npm install
npm run build
```

### Load in Chrome

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from the project

### Configure

1. Click the extensions puzzle icon in Chrome's toolbar
2. Find **Repo Glance** and click the three dots → **Options**
3. Enter your **Claude API key** (required)
4. Optionally enter a **GitHub Personal Access Token** to increase the rate limit from 60 to 5,000 requests/hour and access private repos

## Usage

1. Navigate to any GitHub repository page (e.g. `github.com/owner/repo`)
2. Click the RepoGlance extension icon in the toolbar
3. A sidebar slides in from the right with a loading spinner
4. The AI-generated summary appears with four sections

Summaries are cached by repo and branch SHA, so revisiting the same repo loads instantly.

## Development

```bash
# Start dev server with HMR
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Project Structure

```
repo-glance/
├── manifest.json              — Chrome MV3 manifest
├── vite.config.ts             — Vite + @crxjs/vite-plugin config
├── src/
│   ├── background.ts          — Service worker: orchestrates fetch → cache → Claude pipeline
│   ├── content.ts             — Content script: URL parsing, message passing, sidebar init
│   ├── types.ts               — Shared TypeScript types and message protocol
│   ├── sidebar/
│   │   ├── sidebar.ts         — Shadow DOM sidebar with loading/summary/error states
│   │   └── sidebar.css        — Sidebar styles (isolated via Shadow DOM)
│   ├── options/
│   │   ├── options.html       — Settings page markup
│   │   ├── options.ts         — API key form logic
│   │   └── options.css        — Settings page styles
│   └── services/
│       ├── github.ts          — GitHub API client (README, file tree, config files)
│       ├── claude.ts          — Claude API client with response parsing
│       ├── cache.ts           — IndexedDB cache layer via idb
│       └── prompt.ts          — Structured prompt builder
└── tests/
    └── services/
        ├── github.test.ts
        ├── claude.test.ts
        └── prompt.test.ts
```

## Tech Stack

- **TypeScript** — strict mode throughout
- **Vite** + **@crxjs/vite-plugin** — Chrome extension build tooling with HMR
- **Shadow DOM** — sidebar style isolation
- **IndexedDB** (via `idb`) — summary caching
- **Jest** + **ts-jest** — unit testing

## License

ISC
