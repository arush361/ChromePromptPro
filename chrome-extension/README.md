# PromptPro Chrome Extension

AI prompt enhancement for leading chat platforms (ChatGPT, Perplexity, Claude, Gemini, Microsoft Copilot). Secure, lightweight, and production‑ready.

## Contents
- Features
- Security & Privacy
- Directory Structure
- Quick Start (Development)
- Production Build & Packaging
- Versioning Workflow
- Loading the Extension (Dev vs Prod)
- API Key Management
- Accessibility & UX Notes
- Troubleshooting

## Features
- ✨ Contextual improvement of user prompts (GPT‑4o‑mini)
- 🧠 Refinement workflow with iterative enhancement
- 🔒 No bundled / hard‑coded API key; user supplies their own
- ⚡ Minimal, lazy UI injection (appears after 3+ chars typed)
- 🪶 Small footprint with minified production build
- 🔁 Separate enhance vs refine flows

## Security & Privacy
- No OpenAI API key is stored in source or repository.
- API key is saved using `chrome.storage.sync` (scoped to the user’s Chrome profile) and only transmitted directly to OpenAI’s API.
- No third‑party analytics, tracking, or remote code.
- Limited permissions: only `storage`, `activeTab`, and specific host permissions required for supported sites and the OpenAI API endpoint.

## Directory Structure
```
chrome-extension/
  background.js        # Service worker: API calls & message handling
  content.js           # Injects UI trigger & communicates with background
  popup.html           # Settings UI (API key entry)
  popup.js             # Logic for saving/testing API key
  styles.css           # Injected styles + popup styles
  manifest.json        # Chrome MV3 manifest
  package.json         # Build tooling (minify + zip)
  icons/               # Extension icons
  dist/                # (Generated) Minified production bundle
```

## Quick Start (Development / Unpacked Source)
1. Open Chrome: navigate to `chrome://extensions/`.
2. Enable Developer Mode (top right toggle).
3. Click “Load unpacked” and select `chrome-extension/` (NOT `dist/`).
4. Pin the extension (optional) and open the popup.
5. Enter your OpenAI API key and Save.
6. Navigate to a supported site and begin typing (≥3 chars) to see the Improve Prompt button.

This mode uses the unminified JS directly (ideal for debugging).

## Production Build & Packaging
Requirements: Node.js ≥18, npm.

Option A – NPM scripts (run inside `chrome-extension/`):
```
npm install
npm run build        # creates dist/
npm run build:zip    # build + creates promptpro-extension-v<version>.zip
```

Option B – Root convenience script:
```
./scripts/build-extension.sh        # installs (if needed), builds, zips
./scripts/build-extension.sh --no-install   # skip npm install (CI cache)
```
Outputs:
- `chrome-extension/dist/` (minified assets)
- `chrome-extension/promptpro-extension-v<version>.zip`

## Versioning Workflow
1. Update `manifest.json` "version" (semantic recommended, e.g. 1.1.0).
2. (Optional) Mirror same version in `chrome-extension/package.json` if you want aligned naming (current zip uses `package.json` version for naming; adjust if desired).
3. Run the build script to produce a matching zip.
4. Upload zip to Chrome Web Store or distribute privately.

Note: Currently zip name uses `package.json` version. If you prefer manifest-driven naming, adapt `zip` script or `build-extension.sh` (already extracts manifest version for log output).

## Loading the Extension
- Development: Load the root `chrome-extension/` directory.
- Production: Load the `dist/` directory (after build) OR upload the generated zip to the Chrome Web Store.

Chrome will not auto-reload when you modify source files; after changes, click the circular arrow icon on the extension card.

## API Key Management
- Open popup (toolbar icon) → enter key → Save.
- Key is retrieved at runtime by background script before calling OpenAI.
- Remove/replace key anytime (blank + Save clears it).
- Failure states: If missing, enhancement request returns an error which the UI should surface.

## Accessibility & UX Notes
- Trigger button only appears when it adds value (≥3 chars) to reduce noise.
- Modal (refinement) supports scrolling for long content.
- Clear role separation: content script = UI; background = network/API.
- Consider future improvements: focus trapping in modal, ARIA labels, high contrast mode toggle.

## Customization Tips
- Change model: edit `model` field in `background.js` (ensure allowed by user’s key/quota).
- Adjust temperature / max tokens similarly in API request body.
- Add new supported sites: extend `matches` array in `manifest.json` plus selectors in `content.js` if site structures differ.

## Troubleshooting
| Symptom | Fix |
|---------|-----|
| Improve button never appears | Ensure site is in supported list; type ≥3 chars; open DevTools console for errors. |
| API error message | Re-check API key validity / quota; verify network tab for OpenAI response. |
| Key “missing” after restart | Sync storage may be disabled; retry entering key; check chrome profile sync settings. |
| Dist not generated | Ensure `npm install` ran; check Node version (>=18). |
| Zip missing after build:zip | Verify build succeeded; inspect script output for errors. |

## Contributing
- Keep background logic stateless except for pulling API key.
- Avoid adding new permissions unless necessary.
- Run a production build before submitting release PR.

## License
(Add your chosen license here if not already provided elsewhere.)

---
Maintained with a focus on security, minimalism, and clarity. Enjoy improving your prompts!