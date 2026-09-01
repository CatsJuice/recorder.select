#!/bin/bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
ARTIFACT_DIRECTORY="${REPOSITORY_ROOT}/artifacts"
APP_PATH="${ARTIFACT_DIRECTORY}/RecorderBench.app"
ZIP_PATH="${ARTIFACT_DIRECTORY}/RecorderBench.zip"

if [[ ! -d "${APP_PATH}" || ! -f "${ZIP_PATH}" ]]; then
  echo "Run scripts/build-macos-app.sh with a Developer ID identity first." >&2
  exit 1
fi

if ! command -v asc >/dev/null 2>&1; then
  echo "asc is required. Install it with: brew install asc" >&2
  exit 1
fi

codesign --verify --deep --strict --verbose=2 "${APP_PATH}"
asc notarization submit --file "${ZIP_PATH}" --wait --poll-interval 30s --timeout 1h --output table
xcrun stapler staple "${APP_PATH}"
xcrun stapler validate "${APP_PATH}"
spctl --assess --type execute --verbose=2 "${APP_PATH}"

# Recreate the archive so the GitHub asset contains the stapled app.
rm -f "${ZIP_PATH}"
ditto -c -k --keepParent "${APP_PATH}" "${ZIP_PATH}"
shasum -a 256 "${ZIP_PATH}" > "${ZIP_PATH}.sha256"

echo "Notarized ${ZIP_PATH}"
