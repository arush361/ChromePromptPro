# PromptPro Monorepo

Unified workspace for the PromptPro Chrome Extension plus supporting backend & frontend components.

## Overview
PromptPro elevates user-written AI prompts by transforming and refining them via OpenAI models. This repository contains:
- chrome-extension/  (MV3 extension: prompt enhancement & refinement)
- backend/           (FastAPI service with basic status endpoints, MongoDB persistence)
- frontend/          (Placeholder React/Tailwind app scaffold)
- scripts/           (Build & packaging utilities)
- tests/             (Python test placeholder)

## Key Features
- Secure Chrome MV3 architecture (no hard‑coded API keys)
- User-supplied OpenAI key stored with `chrome.storage.sync`
- Build tooling: minification + deterministic zip packaging
- Modular separation (background vs content script vs popup)
- Backend FastAPI example (extensible for future services)

## For Non-Technical Users (No Coding Required)
If you only want to USE the Chrome extension, this section is for you. You do NOT need to run any code, servers, or terminals.

### What Is PromptPro?
PromptPro helps you turn a rough prompt into a clearer, more effective one. You type something, click a button, and an improved version appears with better structure, tone, and clarity. You can then apply it directly.

### Is It Safe?
- Your OpenAI API key stays in your browser (Chrome sync storage). It is NOT sent anywhere except directly to OpenAI when improving a prompt.
- We do NOT collect analytics, personal data, or usage logs.

### Quick Install (First Time)
1. Download the latest release ZIP (link: coming soon on GitHub Releases).  
2. Unzip it (you will get a folder like `chrome-extension/dist/` or a versioned folder).  
3. Open Chrome and go to: `chrome://extensions`.  
4. Turn on Developer Mode (toggle in top-right).  
5. Click "Load unpacked".  
6. Select the unzipped extension folder (the one containing `manifest.json`).  
7. The PromptPro icon appears in your toolbar (pin it via the puzzle icon if needed).

### Add Your OpenAI API Key (One Time)
1. Click the PromptPro toolbar icon.  
2. Paste your OpenAI API key (get one at: https://platform.openai.com/ ) and click Save.  
3. Close the popup. You're ready.

### Where Do I Get an API Key?
1. Sign in at https://platform.openai.com/  
2. Go to API Keys in your account settings.  
3. Create a new key and copy it. (Treat it like a password.)  
4. Paste into the extension popup.  
If the key stops working later, repeat these steps and save a new one.

### Using PromptPro on a Supported Site
Currently supported examples:  
- ChatGPT (chat.openai.com)  
- Microsoft Copilot (copilot.microsoft.com)  
(If a site update breaks support, check the project page for updates.)

Steps:
1. Go to a supported site and start typing a prompt as usual.  
2. Select (highlight) the text you want improved OR place your cursor in the input box.  
3. Click the injected Improve / Enhance button (or the PromptPro button in the page UI).  
4. A panel/modal opens showing:  
   - Original prompt  
   - Improved version (with formatting)  
5. (Optional) Refine again with a persona (e.g., "Teacher", "Executive Summary") if available.  
6. Click "Apply Enhanced Prompt" to replace your original text. Submit as normal.

### What You Will See
- A small button near or below the input box.  
- A modal with headings, improved text, and action buttons.  
- A spinner saying "Enhancing your prompt..." while it works.  
If nothing appears, see troubleshooting below.

### Updating the Extension
1. Remove the old version in `chrome://extensions` (trash/bin icon).  
2. Download & unzip the new release.  
3. Load it again via "Load unpacked".  
(Your saved API key should remain unless you cleared browser data.)

### Simple Troubleshooting
| Problem | Easy Fix |
|---------|----------|
| No Improve button | Make sure you're on a supported site and typed at least a few characters. Refresh page. |
| Says missing API key | Open the popup and re-enter your key. |
| Gets an error from OpenAI | Check key validity or usage limits on your OpenAI account. |
| Nothing happens on click | Refresh tab; if still broken, remove & re-load the extension. |
| Improved text looks odd | Try refining again or slightly rephrasing your original prompt. |

### Privacy & Safety (Plain Language)
- We do not track you.  
- Your key is only used to call OpenAI for YOUR prompt improvement.  
- Remove your key any time by deleting it in the popup or removing the extension.  

### Glossary
- Prompt: The text you give an AI.  
- Enhance / Improve: Make the prompt clearer or more effective.  
- Persona: A style or role used to shape the improved prompt (e.g., "Technical Reviewer").  
- Modal: The pop-up window that shows the improved version.  
- API Key: A secret code that lets the extension talk to OpenAI on your behalf.  

### Need More Help?
Open an issue on GitHub (describe what you did, what you expected, what happened). No code knowledge required.

---

## Repository Structure
```
/README.md                # Root documentation (this file)
/chrome-extension/        # Core extension source & its own README
/backend/                 # FastAPI app (Mongo-backed example)
/frontend/                # React UI (future expansion)
/scripts/                 # Helper scripts (build-extension.sh)
/tests/                   # Test package (expand with real tests)
```

## Quick Start
### 1. Chrome Extension (Development Mode)
See `chrome-extension/README.md` for full details.
```
cd chrome-extension
npm install
# Load unpacked: chrome://extensions (choose chrome-extension/)
```
Open popup, enter OpenAI API key, start using on supported sites.

### 2. Backend (FastAPI)
Requirements: Python 3.11+, MongoDB instance.
```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Set environment variables (example)
export MONGO_URL="mongodb://localhost:27017" \
       DB_NAME="promptpro"
uvicorn server:app --reload --port 8000
```
Endpoints:
- GET  /api/          -> {"message":"Hello World"}
- POST /api/status     (create status check)
- GET  /api/status     (list status checks)

### 3. Frontend
Scaffold exists (React + Tailwind). Run if/when needed:
```
cd frontend
npm install
npm start
```

## Production Extension Build
(From repo root)
```
./scripts/build-extension.sh
# OR inside chrome-extension/
npm run build:zip
```
Outputs:
- Minified assets in `chrome-extension/dist/`
- Zip archive `promptpro-extension-v<version>.zip`

## Versioning & Release
- Update `chrome-extension/manifest.json` version (semantic recommended)
- (Optional) Sync `chrome-extension/package.json` version if aligning naming
- Run build script -> produce new zip
- Submit to Chrome Web Store or distribute internally

## Security & Privacy
- No API keys committed; user stores their own key locally (sync scope)
- Limited permissions (`storage`, `activeTab`, host list for supported sites + OpenAI API)
- No analytics or remote injection
- Background service worker mediates all network calls to OpenAI

## Development Workflow
1. Implement or adjust feature in extension (content/background/popup)
2. Update docs / manifest / version
3. Run build & sanity test (load `dist/`)
4. Commit with conventional message (e.g., feat: add refine tab scroll)
5. Prepare release tag if publishing

## Backend Expansion Ideas
- Persist user prompt histories (if user opts in)
- Rate limiting & auth layer (API keys or JWT)
- Logging & analytics (privacy-preserving)

## Contribution Guidelines
- Principle of least privilege for permissions and dependencies
- Prefer small, focused PRs
- Document new environment variables
- Add tests for backend logic as it grows
- Keep extension popup & injected UI accessible (WCAG 2.1 AA)

## Troubleshooting (Extension)
| Issue | Remedy |
|-------|--------|
| Improve button absent | Type ≥3 chars; confirm supported domain; check console for errors |
| API error surface | Re-enter key; check quota; inspect network tab |
| Build missing dist | Run npm install, ensure Node ≥18 |
| Zip version mismatch | Align manifest + package.json or adjust build script |

## License
(Add license text or reference here.)

## Further Documentation
See `chrome-extension/README.md` for deep extension usage/build notes.

---
Maintained with a focus on clarity, security, and minimalism.
