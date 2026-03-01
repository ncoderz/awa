---
name: perform-release
description: Ensure on main and up-to-date, bump the version semantically, and create a GitHub release with automatic release notes. Use this when asked to perform or create a release.
---

# Perform a Release

## User Input

```text
${input}
```

You **MUST** consider the user input before proceeding (if not empty). The user may specify the semver bump level (patch, minor, major) or a specific version. If not specified, infer the appropriate bump from recent changes.

## Action

Verify the repo is on an up-to-date main branch, bump the version semantically, commit and push the version change, then create a GitHub release with automatic release notes.

## Process

### 1. VERIFY ON MAIN AND UP-TO-DATE

Confirm the current branch is `main` (or the repo's default branch):

```sh
git branch --show-current
```

If the current branch is NOT `main`, **stop immediately** and inform the user:

> "Cannot proceed — current branch is `<branch>`, not `main`. Please switch to `main` first."

Ensure there are no uncommitted changes:

```sh
git status --porcelain
```

If there are uncommitted changes, **stop immediately** and inform the user:

> "Cannot proceed — there are uncommitted changes. Please commit or stash them first."

Pull latest from origin and verify the local branch is up-to-date:

```sh
git pull --ff-only
```

If the pull fails (e.g. diverged history), **stop immediately** and inform the user:

> "Cannot proceed — local `main` has diverged from `origin/main`. Please resolve manually."

### 2. VERIFY BUILD AND TESTS

Discover and run the project's build and test commands. Check for common patterns in order:

| Check            | How to detect                                    |
|------------------|--------------------------------------------------|
| Node.js project  | `package.json` exists → `npm run build && npm test` (or `yarn`/`pnpm`/`bun` per lockfile) |
| Rust project     | `Cargo.toml` exists → `cargo build && cargo test` |
| Python project   | `pyproject.toml`/`setup.py` → `python -m pytest`  |
| Go project       | `go.mod` exists → `go build ./... && go test ./...` |
| Other            | Look for `Makefile`, `justfile`, or CI config for build/test commands |

You MUST NOT proceed if the build or tests fail. Prompt user to fix any issues first.

### 3. DETERMINE VERSION BUMP

> **Monorepo note:** This project uses npm workspaces. The publishable package is in `packages/awa/`. The root `package.json` is private and its version field is not used for releases. Always read and bump the version in `packages/awa/package.json`.

Read the current version from `packages/awa/package.json`:

Determine the bump level:
- If the user specified a bump level (`patch`, `minor`, `major`) or an explicit version, use that.
- Otherwise, infer from recent changes since the last tag:
  - **major** — breaking changes (look for `BREAKING CHANGE` in commits, or `!` after type)
  - **minor** — new features (`feat:` commits)
  - **patch** — bug fixes, docs, refactors, chores (everything else)

To inspect recent commits since the last tag:

```sh
git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline
```

### 4. BUMP THE VERSION

Update the version in the project manifest. Use the appropriate tool for the project type:

| Project Type | Command |
|-------------|---------|
| Node.js     | `npm version <patch\|minor\|major> --no-git-tag-version` |
| Rust        | Edit `Cargo.toml` version field directly |
| Python      | Edit `pyproject.toml` or `setup.py` version field directly |
| Other       | Edit the relevant manifest file directly |

The `--no-git-tag-version` flag (Node.js) prevents npm from creating a commit and tag — we handle that ourselves.

> **Monorepo note:** Run the version bump targeting the `packages/awa` workspace, from the repo root:
> ```sh
> npm version <patch|minor|major> --no-git-tag-version -w packages/awa
> ```

Verify the new version:

```sh
# Read from the correct package in this monorepo
node -p "require('./packages/awa/package.json').version"
```

### 5. COMMIT AND PUSH

Stage and commit the version bump:

```sh
git add -A
git commit -m "chore: release v<new-version>"
git push
```

### 6. CREATE GITHUB RELEASE

Create a release using the GitHub CLI with automatic release notes:

```sh
gh release create v<new-version> --generate-notes --title "v<new-version>"
```

This will:
- Create a git tag `v<new-version>` pointing at the current commit
- Generate release notes automatically from merged PRs and commits since the last release
- Publish the release on GitHub

Verify the release was created:

```sh
gh release view v<new-version>
```

## Rules

You SHALL verify you are on `main` before proceeding and abort if not.
You SHALL verify there are no uncommitted changes and abort if there are.
You SHALL verify local `main` is up-to-date with `origin/main` and abort if not.
You SHALL verify the build and tests pass before bumping the version.
You SHALL use semantic versioning for the version bump.
You SHALL NOT include `Claude` or any AI signature in commit messages.
You SHALL use `--generate-notes` to let GitHub produce release notes automatically.
You SHALL use the tag format `v<version>` (e.g. `v1.4.0`).
You SHALL stop and report if any step fails (build, test, push, release creation).
You SHOULD infer the bump level from commit history when not specified by the user.
You MAY ask the user to confirm the bump level before proceeding if the inference is ambiguous.
