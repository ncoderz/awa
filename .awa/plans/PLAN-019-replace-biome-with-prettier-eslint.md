# Replace Biome with Prettier + ESLint

STATUS: completed
DIRECTION: bottom-up

## Context

The project currently uses Biome for both linting and formatting. Migrating to Prettier + ESLint provides broader ecosystem support, granular control, and familiarity for contributors. The goal is an idiomatic Prettier/ESLint setup — not a 1:1 Biome rule mapping.

### Biome Touchpoints

- `package.json` devDependencies: `@biomejs/biome`
- `package.json` scripts: `lint`, `lint:fix`, `format`, `build` (calls `lint`)
- `biome.json` (config file)
- `ARCHITECTURE.md` — Technology Stack table, Architectural Rules, Developer Commands table
- Templates that reference Biome (agent files, partials) — need audit

## Steps

### Phase 1: Install Dependencies

- [x] Install all packages in one go:
  ```
  npm install -D prettier eslint @eslint/js @eslint/json typescript-eslint eslint-plugin-prettier eslint-plugin-simple-import-sort
  ```

### Phase 2: Configure Prettier

- [x] Create `.prettierrc.json`:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "tabWidth": 2,
    "useTabs": false,
    "printWidth": 100
  }
  ```
- [x] Create `.prettierignore`:
  ```
  dist/
  node_modules/
  templates/
  .github/
  outputs/
  ```

### Phase 3: Configure ESLint

- [x] Create `eslint.config.js` (flat config, ESM) with the following blocks:

  Global ignores: dist/, node_modules/, templates/, .github/, outputs/, coverage/, website/, *.d.ts

  TypeScript files (*.ts):
  - Extend `tseslint.configs.recommended`
  - Plugins: `eslint-plugin-prettier`, `eslint-plugin-simple-import-sort`
  - `parserOptions.project`: `['./tsconfig.json', './tsconfig.test.json']`
  - Rules: `simple-import-sort/imports` (error), `simple-import-sort/exports` (error), `prettier/prettier` (error), `@typescript-eslint/no-floating-promises` (error), `@typescript-eslint/no-unused-vars` (warn, ignore `_` prefix), `@typescript-eslint/no-empty-object-type` (error, allowInterfaces)

  Test file overrides (__tests__/*, *.test.ts):
  - `@typescript-eslint/no-non-null-assertion`: off
  - `@typescript-eslint/no-non-null-asserted-optional-chain`: off

  Root config files (*.config.ts, *.config.js, scripts/*):
  - Disable `parserOptions.project` (not in tsconfig)
  - Disable `@typescript-eslint/no-floating-promises`

  JavaScript files (*.js, *.mjs):
  - Extend `@eslint/js` recommended
  - Plugins: `eslint-plugin-prettier`, `eslint-plugin-simple-import-sort`
  - Add Node.js globals (`console`, `process`)
  - Rules: `simple-import-sort/imports`, `simple-import-sort/exports`, `prettier/prettier` (all error)

  JSON files (*.json, *.jsonc):
  - Extend `@eslint/json` recommended
  - Exclude `package-lock.json`

### Phase 4: Update package.json Scripts

- [x] Replace `lint` script: `"lint": "eslint ."`
- [x] Replace `lint:fix` script: `"lint:fix": "eslint --fix ."`
- [x] Replace `format` script: `"format": "prettier --write ."`
- [x] Verify `build` script still works (it calls `lint` transitively)
- [x] Remove `@biomejs/biome` from devDependencies

### Phase 5: Remove Biome

- [x] Delete `biome.json`
- [x] Run `npm install` to prune Biome from `node_modules` and lockfile

### Phase 6: Validate

- [x] Run `npm run format` to reformat all files with Prettier
- [x] Run `npm run lint:fix` to auto-fix import sorting and other fixable issues
- [x] Run `npm run lint` to verify ESLint passes cleanly
- [x] Run `npm run build && npm run test` to confirm nothing broke

### Phase 7: Update Documentation and Specs

- [x] Update `ARCHITECTURE.md` Technology Stack table: replace Biome row with Prettier + ESLint
- [x] Update `ARCHITECTURE.md` Architectural Rules: "Prettier for formatting; ESLint for linting; strict TypeScript; ESM-only output"
- [x] Update `ARCHITECTURE.md` Developer Commands table: update lint/format command descriptions
- [x] Audit templates (`templates/awa/`, `templates/example/`) for references to Biome — update if present
- [ ] Run `awa check --spec-only` to verify spec integrity

### Phase 8: CI/Editor Config

- [x] Verify `.vscode/settings.json` or `.editorconfig` if present — add Prettier as default formatter
- [x] Check GitHub Actions workflows for Biome references — update if present

## Risks

- Formatting drift: Prettier may format some files differently than Biome. Mitigated by running `prettier --write .` as a one-time reformat and committing the result.
- Import sort churn: `eslint-plugin-simple-import-sort` will reorder all imports on first `--fix` pass. This is a one-time large diff that should be committed separately.
- Performance: ESLint + Prettier is slower than Biome. For a project of this size (~100 source files) the difference is negligible.

## Dependencies

- None — this is a standalone tooling change with no feature dependencies.

## Completion Criteria

- [x] `biome.json` deleted, `@biomejs/biome` removed from `package.json`
- [x] `.prettierrc.json` and `eslint.config.js` present with idiomatic rules
- [x] `npm run lint`, `npm run format`, `npm run build`, `npm run test` all pass
- [x] `ARCHITECTURE.md` updated to reference Prettier + ESLint
- [x] No remaining references to Biome in code, scripts, or documentation

## Open Questions

- [x] Import sorting plugin? — Use `eslint-plugin-simple-import-sort`
- [x] Prettier integration approach? — Use `eslint-plugin-prettier` (runs Prettier as an ESLint rule)
- [x] JSON linting? — Yes, via `@eslint/json`
- [x] Markdown linting? — No

## References

- Config: `biome.json`
- Config: `package.json` (scripts, devDependencies)
- Spec: `.awa/specs/ARCHITECTURE.md` (Technology Stack, Architectural Rules, Developer Commands)
