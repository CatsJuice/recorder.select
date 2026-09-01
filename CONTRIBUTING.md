# Contributing

Thank you for helping make recorder comparisons more transparent.

## Code changes

1. Create a focused branch.
2. Keep benchmark collection code deterministic and low overhead.
3. Run `swift test --package-path apps/benchmark-macos` for RecorderBench changes.
4. Run `npm run lint && npm run build` for website changes.
5. Explain any dataset or schema changes in the pull request.

RecorderBench must remain team-neutral. Local Debug builds use ad-hoc signing, so don't add a personal `DEVELOPMENT_TEAM`, provisioning profile, certificate name, or signing asset to the Xcode project. The release workflow injects those values from repository secrets.

## Benchmark submissions

- Follow `docs/BENCHMARK_PROTOCOL.md`.
- Don't edit measured values by hand.
- Include the raw RecorderBench JSON.
- Keep generated CSV beside its JSON when detailed timeline review is useful.
- Remove personal notes or paths that shouldn't be public before committing.
- Results collected under materially different workloads must not be averaged together.

Product vendors may submit corrections and benchmark results. Please disclose your relationship to the product in the pull request.

## Commit messages

Use English Conventional Commit messages:

```text
type(scope): brief summary

Optional explanation of the change.
```
