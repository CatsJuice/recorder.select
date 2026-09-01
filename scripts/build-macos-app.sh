#!/bin/bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIRECTORY}/.." && pwd)"
PACKAGE_DIRECTORY="${REPOSITORY_ROOT}/apps/benchmark-macos"
PROJECT_PATH="${PACKAGE_DIRECTORY}/RecorderBench.xcodeproj"
BUILD_DIRECTORY="${REPOSITORY_ROOT}/.build/recorderbench-xcode"
ARCHIVE_PATH="${BUILD_DIRECTORY}/RecorderBench.xcarchive"
EXPORT_DIRECTORY="${BUILD_DIRECTORY}/export"
ARTIFACT_DIRECTORY="${REPOSITORY_ROOT}/artifacts"
APP_PATH="${ARTIFACT_DIRECTORY}/RecorderBench.app"
VERSION_VALUE="${VERSION:-0.1.0}"
BUILD_NUMBER_VALUE="${BUILD_NUMBER:-1}"
SIGNING_IDENTITY_VALUE="${RECORDERBENCH_SIGNING_IDENTITY:--}"
TEAM_ID_VALUE="${APPLE_TEAM_ID:-}"
MODULE_CACHE_DIRECTORY="${REPOSITORY_ROOT}/.build/xcode-module-cache"

mkdir -p "${MODULE_CACHE_DIRECTORY}" "${ARTIFACT_DIRECTORY}"
rm -rf "${BUILD_DIRECTORY}" "${APP_PATH}"
export CLANG_MODULE_CACHE_PATH="${MODULE_CACHE_DIRECTORY}"

if [[ "${SIGNING_IDENTITY_VALUE}" == "-" ]]; then
  xcodebuild archive -quiet \
    -project "${PROJECT_PATH}" \
    -scheme RecorderBench \
    -configuration Release \
    -archivePath "${ARCHIVE_PATH}" \
    -derivedDataPath "${BUILD_DIRECTORY}/DerivedData" \
    -destination "generic/platform=macOS" \
    MARKETING_VERSION="${VERSION_VALUE}" \
    CURRENT_PROJECT_VERSION="${BUILD_NUMBER_VALUE}" \
    CODE_SIGNING_ALLOWED=NO

  ditto "${ARCHIVE_PATH}/Products/Applications/RecorderBench.app" "${APP_PATH}"
  codesign --force --deep --sign - "${APP_PATH}"
else
  if [[ -z "${TEAM_ID_VALUE}" ]]; then
    echo "APPLE_TEAM_ID is required for Developer ID export." >&2
    exit 1
  fi

  xcodebuild archive -quiet \
    -project "${PROJECT_PATH}" \
    -scheme RecorderBench \
    -configuration Release \
    -archivePath "${ARCHIVE_PATH}" \
    -derivedDataPath "${BUILD_DIRECTORY}/DerivedData" \
    -destination "generic/platform=macOS" \
    MARKETING_VERSION="${VERSION_VALUE}" \
    CURRENT_PROJECT_VERSION="${BUILD_NUMBER_VALUE}" \
    DEVELOPMENT_TEAM="${TEAM_ID_VALUE}" \
    CODE_SIGN_STYLE=Manual \
    CODE_SIGN_IDENTITY="${SIGNING_IDENTITY_VALUE}"

  EXPORT_OPTIONS_PATH="${BUILD_DIRECTORY}/ExportOptions.plist"
  ditto "${PACKAGE_DIRECTORY}/Resources/ExportOptions.plist" "${EXPORT_OPTIONS_PATH}"
  /usr/libexec/PlistBuddy -c "Set :teamID ${TEAM_ID_VALUE}" "${EXPORT_OPTIONS_PATH}"
  /usr/libexec/PlistBuddy -c "Set :signingCertificate ${SIGNING_IDENTITY_VALUE}" "${EXPORT_OPTIONS_PATH}"

  xcodebuild -exportArchive -quiet \
    -archivePath "${ARCHIVE_PATH}" \
    -exportPath "${EXPORT_DIRECTORY}" \
    -exportOptionsPlist "${EXPORT_OPTIONS_PATH}"

  ditto "${EXPORT_DIRECTORY}/RecorderBench.app" "${APP_PATH}"
fi

codesign --verify --deep --strict --verbose=2 "${APP_PATH}"
rm -f "${ARTIFACT_DIRECTORY}/RecorderBench.zip"
ditto -c -k --keepParent "${APP_PATH}" "${ARTIFACT_DIRECTORY}/RecorderBench.zip"

echo "Built ${APP_PATH}"
