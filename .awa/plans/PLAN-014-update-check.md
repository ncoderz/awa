# CLI Update Check

STATUS: done
DIRECTION: bottom-up

## Context

When users run `awa` from the command line, there is no indication if their
installed version is outdated. Other popular Node.js CLIs (e.g. npm itself,
create-react-app, eslint) solve this by periodically querying the registry and
printing a warning when a newer version is available. This plan covers adding
that capability to awa in a minimal, idiomatic way.

## Steps

### Core Implementation

- [x] Create `src/utils/update-check.ts` module
  - Fetches latest version from the npm registry via `https://registry.npmjs.org/@ncoderz/awa/latest`
  - Uses Node.js built-in `fetch` (available in Node 24) — no new dependencies
  - Reads `PACKAGE_INFO.version` for the current version
  - Compares versions with simple semver comparison (split on `.`, compare numerically)
  - Returns `{ current, latest, isOutdated }` or `null` on any error
- [x] Create `src/utils/update-check-cache.ts` module
  - Stores last-check timestamp and latest version in `~/.cache/awa/update-check.json`
  - Exposes `shouldCheck(intervalMs)` → reads cache, returns `true` if missing or stale
  - Exposes `writeCache(latestVersion)` → writes timestamp + version
  - Default check interval: 1 day (86400000 ms)
  - Gracefully handles missing/corrupt cache file (treat as stale)
- [x] Add `printUpdateWarning(logger, result)` function (in `update-check.ts` or separate)
  - Prints a chalk-formatted warning box, e.g.:
    ```
    ⚠ Update available: 1.1.0 → 1.2.0
      Run `npm install -g @ncoderz/awa` to update
    ```
  - For major version bumps, show a distinct message:
    ```
    ⚠ New major version available: 1.1.0 → 2.0.0 (breaking changes)
      See https://github.com/ncoderz/awa/releases for details
      Run `npm install -g @ncoderz/awa` to update
    ```
  - Always shows `npm install -g @ncoderz/awa` as the install command
  - Uses the existing `Logger.warn()` style or a custom boxed format

### Integration

- [x] Hook the update check into the CLI entry (`src/cli/index.ts`)
  - Fire the check asynchronously (non-blocking `Promise`) at process start, before `program.parse()`
  - After command completes (using commander's `hook('postAction', ...)`), `await` the result and print if outdated
  - This avoids delaying CLI startup while the network request is in flight
- [x] Suppress the warning when `--json` or `--summary` flags are active
  - Detect JSON/summary mode from parsed options — either inspect `process.argv` early or check in the postAction hook
  - Also suppress when stdout is not a TTY (`!process.stdout.isTTY`)

### Configuration

- [x] Add optional `[update-check]` table to `.awa.toml` support in config loader
  - `enabled = true` (default) — set `false` to disable update checks entirely
  - `interval = 86400` (seconds, default 1 day) — minimum time between checks
- [x] Respect `NO_UPDATE_NOTIFIER` environment variable (community convention used by `update-notifier` and others) — skip check if set

### Testing

- [x] Unit tests for version comparison logic (equal, patch bump, minor bump, major bump, pre-release)
- [x] Unit tests for cache read/write and staleness logic (mock fs)
- [x] Unit tests for `printUpdateWarning` output — minor/patch vs major version message variants
- [x] Integration test: mock `fetch` to verify end-to-end flow (outdated, up-to-date, network error)

## Risks

- Network request could slow down CLI if not properly async — mitigated by firing before parse and awaiting after command completes
- npm registry could be unreachable (corporate firewalls, offline) — mitigated by catching all errors and silently skipping
- Cache file permissions on shared systems — mitigated by graceful fallback (treat as stale, don't crash)
- Version comparison edge cases with pre-release tags — mitigated by comparing only major.minor.patch numerically; pre-release suffixes treated as equal

## Dependencies

- None — uses Node.js 24 built-in `fetch` and `fs`, plus existing `PACKAGE_INFO` and `Logger`

## Completion Criteria

- [x] Running `awa generate` (or any command) with an outdated version prints an update warning after command output
- [x] Warning is suppressed with `--json`, `--summary`, or non-TTY stdout
- [x] Check hits the network at most once per configured interval (default 1 day)
- [x] Network failures are silent — CLI works identically when offline
- [x] `NO_UPDATE_NOTIFIER=1` disables the check entirely
- [x] All new code has unit tests; existing tests unaffected

## Open Questions

- [x] Should the update message include both `npm install -g` and `npx` instructions, or detect the installation method? — Show `npm install -g @ncoderz/awa` only
- [x] Should the cache interval be configurable via `.awa.toml`, or is an env-var override sufficient? — Add `[update-check]` table to `.awa.toml`
- [x] Should the check also detect major version bumps and show a different message (e.g., "breaking changes — see release notes")? — Yes, distinct message for major bumps

## References

- CLI entry: src/cli/index.ts
- Package info: src/_generated/package_info.ts
- Logger: src/utils/logger.ts
- Config loader: src/core/config.ts
- Architecture: .awa/specs/ARCHITECTURE.md

## Change Log

- 001 (2026-02-28): Initial plan
- 002 (2026-02-28): Resolved open questions — global install only, .awa.toml config, major-version warning
