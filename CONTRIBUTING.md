# Contributing to awa

Thanks for contributing.

## Before You Start

- Review [README.md](README.md), [docs/CLI.md](docs/CLI.md), and [docs/WORKFLOW.md](docs/WORKFLOW.md)
- Search existing issues and pull requests to avoid duplicates
- For non-trivial changes, open an issue first to align scope

## Development Setup

Prerequisites:

- Node.js 24+
- npm

Setup:

```bash
npm install
```

## Build, Test, and Lint

Run these before opening a PR:

```bash
npm run build
npm test
```

Useful commands:

- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run typecheck:all`

## Coding Guidelines

- Keep changes focused and minimal
- Add or update tests for behavior changes
- Do not introduce unrelated refactors in the same PR
- Follow existing code style (Biome + TypeScript conventions)

## Commit and PR Guidelines

- Use clear commit messages
- Keep PRs small and reviewable
- Include:
  - What changed
  - Why it changed
  - How it was tested
- Link related issues (for example: `Closes #123`)

## Template and Docs Changes

If you change `templates/` behavior, also update relevant docs:

- [docs/TEMPLATE_ENGINE.md](docs/TEMPLATE_ENGINE.md)
- [docs/CLI.md](docs/CLI.md)
- [README.md](README.md)

## Security

Do not open public issues for vulnerabilities. See [SECURITY.md](SECURITY.md).

## Code of Conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
