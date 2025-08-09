#!/usr/bin/env bash
set -euo pipefail

# Build and package the PromptPro Chrome extension.
# Usage: ./scripts/build-extension.sh [--no-install]
# Outputs: dist folder and promptpro-extension-v<version>.zip in chrome-extension/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
EXT_DIR="${ROOT_DIR}/chrome-extension"
ZIP_PREFIX="promptpro-extension"
SKIP_INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --no-install) SKIP_INSTALL=true ; shift ;;
    *) echo "Unknown arg: $arg" >&2; exit 1 ;;
  esac
done

cd "$EXT_DIR"

# Extract version from manifest.json (prefer jq if available)
if command -v jq >/dev/null 2>&1; then
  VERSION="$(jq -r '.version' manifest.json)"
else
  VERSION="$(grep -E '"version"' manifest.json | head -1 | sed -E 's/.*"version"\s*:\s*"([^"]+)".*/\1/')"
fi

if [[ -z "${VERSION}" || "${VERSION}" == "null" ]]; then
  echo "Failed to extract version from manifest.json" >&2
  exit 1
fi

echo "==> Building PromptPro extension v${VERSION}" 

if [[ ! -d node_modules ]]; then
  if [[ "$SKIP_INSTALL" == true ]]; then
    echo "node_modules missing and --no-install supplied. Aborting." >&2
    exit 1
  fi
  echo "==> Installing dependencies (first run)"
  npm install --no-audit --no-fund
elif [[ "$SKIP_INSTALL" == false ]]; then
  # Light touch update check (optional)
  echo "==> Ensuring dependencies are present"
  npm install --no-audit --no-fund >/dev/null 2>&1 || true
fi

# Run build
npm run build

DIST_DIR="${EXT_DIR}/dist"
if [[ ! -d "$DIST_DIR" ]]; then
  echo "Build failed: dist directory not found." >&2
  exit 1
fi

ZIP_NAME="${ZIP_PREFIX}-v${VERSION}.zip"
ZIP_PATH="${EXT_DIR}/${ZIP_NAME}"

# Remove existing zip if present
rm -f "$ZIP_PATH"

# Create zip (exclude any source maps if they existed)
( cd "$DIST_DIR" && zip -rq "$ZIP_PATH" . )

SIZE_HUMAN="$(du -h "$ZIP_PATH" | cut -f1)"

echo "==> Packaged: $ZIP_PATH ($SIZE_HUMAN)"
echo "Load this unpacked by selecting the dist folder or upload the zip to the Chrome Web Store." 
