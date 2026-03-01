---
name: main-branch-to-pr
description: Checkout main, verify build/tests, create a branch, commit changes, open a GitHub PR, merge it, and clean up. Use this when asked to ship changes via PR from main.
---

# Ship Changes via PR from Main

## User Input

```text
${input}
```

You **MUST** consider the user input before proceeding (if not empty).

## Action

Take the current uncommitted changes on main, verify them, and ship them through a GitHub PR workflow: branch → commit → PR → merge → cleanup.

## Process

### 1. VERIFY ON MAIN

Confirm the current branch is `main` (or the repo's default branch):

```sh
git branch --show-current
```

If the current branch is NOT `main`, **stop immediately** and inform the user:

> "Cannot proceed — current branch is `<branch>`, not `main`. Please switch to `main` first."

Do NOT attempt to checkout or switch branches.

If on `main`, pull latest:

```sh
git pull --ff-only
```

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

### 3. CREATE BRANCH

Derive a short, descriptive branch name from the changes:

- Inspect changed files: `git diff --name-only` (unstaged) and `git diff --cached --name-only` (staged)
- Choose a prefix: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/`, `test/`
- Use kebab-case: e.g. `fix/req-schema-as-an-regex`, `feat/add-overlay-support`

```sh
git checkout -b <branch-name>
```

### 4. STAGE AND COMMIT

Stage all changes and create a conventional commit:

```sh
git add -A
git commit -m "<type>: <short summary>"
```

Commit message rules:
- **type** — one of: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`, `perf`, `ci`, `build`
- **summary** — imperative mood, lowercase start, no period, max 128 chars
- If changes span multiple concerns, prefer a single encompassing type or split into multiple commits

Examples:
- `feat: add overlay merging support`
- `fix: allow AS AN in user story regex`
- `docs: update CLI reference for check command`

### 5. PUSH AND CREATE PR

Push the branch and open a pull request:

```sh
git push -u origin <branch-name>
gh pr create --fill --base main
```

If `--fill` produces an inadequate title/body, use explicit flags:

```sh
gh pr create --title "<type>: <summary>" --body "<description of changes>" --base main
```

Verify the PR was created:

```sh
gh pr view --web
```

### 6. MERGE THE PR

Merge the pull request using squash merge (keeps history clean):

```sh
gh pr merge --squash --delete-branch
```

If squash is not available, fall back to:

```sh
gh pr merge --merge --delete-branch
```

### 7. CLEANUP

Return to main and pull the merged changes:

```sh
git checkout main && git pull --ff-only
```

Delete the local branch if it still exists:

```sh
git branch -d <branch-name> 2>/dev/null
```

## Rules

You SHALL verify you are on `main` before proceeding and abort if not.
You SHALL verify the build and tests pass before creating a branch.
You SHALL use conventional commit message format (`type: summary`).
You SHALL NOT include `Claude` or any AI signature in commit messages.
You SHALL create the PR against `main` (or the repo's default branch).
You SHALL use `--delete-branch` when merging to auto-clean the remote branch.
You SHALL return to `main` after merging.
You SHALL stop and report if any step fails (build, test, push, PR creation, merge).
You SHOULD prefer squash merge to keep commit history clean.
You SHOULD use `gh pr view` to confirm the PR exists before merging.
You MAY split unrelated changes into separate commits if appropriate.
