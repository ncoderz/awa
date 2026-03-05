# PROJECT — awa

> CLI tool and structured workflow for AI-assisted development with full spec-to-code traceability.

## Directory Layout

```
src/cli/            # CLI entry point, argument parsing, option handling
src/commands/       # Command implementations (check, trace, generate, diff, etc.)
src/core/           # Core engine: template, generator, resolver, config, differ
src/core/check/     # Spec validation, marker scanning, schema checking
src/core/codes/     # Feature code scanning and reporting
src/core/features/  # Feature flag discovery and scanning
src/core/merge/     # Feature code merging
src/core/recode/    # Feature code renaming
src/core/renumber/  # Spec file renumbering
src/core/trace/     # Traceability chain resolution and formatting
src/core/validate/  # Input validation
src/types/          # Shared TypeScript type definitions
src/utils/          # Shared utilities (fs, logger, debouncer, file watcher)
templates/          # Bundled Eta templates (awa, awa2, example)
scripts/            # Build and init scripts
website/            # Astro documentation site
.awa/               # Specs, tasks, plans, rules
```

## Developer Commands

- `npm install` — Install dependencies
- `npm run dev` — Run CLI in development mode (via tsx)
- `npm run build` — Lint, typecheck, and build with tsup
- `npm test` — Run test suite (vitest)
- `npm run lint` — Run ESLint with zero warnings
- `npm run typecheck:all` — Typecheck source and test files
- `npm run check` — Full traceability check (specs + code markers)
- `npm run dev -- check --spec-only` — Validate specs only
- `npm run dev -- trace` — Explore traceability chains

## Feature Codes

Run `awa spec codes` for the live inventory. The table below defines scope boundaries.

| Code | Feature | Scope Boundary |
|------|---------|----------------|
