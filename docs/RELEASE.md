# macOS release guide

RecorderBench is distributed outside the Mac App Store as a universal, Developer ID-signed and notarized ZIP.

The checked-in Xcode project intentionally has no development team. Contributors run Debug builds with ad-hoc “Sign to Run Locally” signing; only the release script injects `APPLE_TEAM_ID` and switches the archive to manual Developer ID signing.

## Local release

Prerequisites:

- an Apple Developer Program membership;
- a `Developer ID Application` certificate in the login keychain;
- `asc` authenticated with an App Store Connect API key;
- Xcode and its command-line tools.

Verify the identity:

```bash
security find-identity -v -p codesigning | grep "Developer ID Application"
```

Build and sign:

```bash
VERSION=0.1.0 \
BUILD_NUMBER=1 \
APPLE_TEAM_ID="TEAMID" \
RECORDERBENCH_SIGNING_IDENTITY="Developer ID Application: Example (TEAMID)" \
scripts/build-macos-app.sh
```

Submit, staple, and verify:

```bash
scripts/notarize-macos-app.sh
```

The finished assets are `artifacts/RecorderBench.zip` and its `.sha256` file.

## GitHub Actions secrets

Configure these repository secrets before pushing a release tag:

| Secret | Purpose |
| --- | --- |
| `DEVELOPER_ID_APPLICATION_CERTIFICATE_BASE64` | Base64-encoded `.p12` containing the Developer ID Application certificate and private key |
| `DEVELOPER_ID_APPLICATION_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` |
| `DEVELOPER_ID_APPLICATION_IDENTITY` | Full identity, for example `Developer ID Application: Example (TEAMID)` |
| `APPLE_TEAM_ID` | Apple Developer team ID used by Xcode Archive export |
| `RELEASE_KEYCHAIN_PASSWORD` | Temporary CI keychain password |
| `ASC_KEY_ID` | App Store Connect API key ID |
| `ASC_ISSUER_ID` | App Store Connect issuer ID |
| `ASC_PRIVATE_KEY_BASE64` | Base64-encoded `.p8` API private key |

Create base64 values without line wrapping:

```bash
base64 < DeveloperID.p12 | tr -d '\n'
base64 < AuthKey_ABC123.p8 | tr -d '\n'
```

## Publish

1. Update `BenchmarkViewModel.toolVersion` if necessary.
2. Run the Swift and website checks.
3. Push a tag such as `v0.1.0`.
4. Confirm GitHub Actions completes signing, notarization, stapling, and Gatekeeper assessment.
5. Download the release ZIP on a clean Mac and open it once before announcing the release.

Certificates and private keys must never be committed to the repository.
