---
title: Traceability
description: How IDs and markers connect requirements, design, code, and tests in awa.
---

awa's traceability system connects every artifact — from requirements to tests — through explicit IDs and code markers. Nothing is implied; every link is stated.

## The Traceability Chain

```
REQ-{CODE}-*.md
  └── {CODE}-1: Requirement title
        └── {CODE}-1_AC-1: Acceptance criterion
                │
                ▼
DESIGN-{CODE}-*.md
  └── {CODE}-ComponentName
        ├── IMPLEMENTS: {CODE}-1_AC-1
        └── {CODE}_P-1: Correctness property
                │
                ▼
Source code
  └── // @awa-component: {CODE}-ComponentName
      └── // @awa-impl: {CODE}-1_AC-1
                │
                ▼
Tests
  ├── // @awa-test: {CODE}_P-1        ← verifies property
  └── // @awa-test: {CODE}-1_AC-1     ← verifies acceptance criterion
```

Every link is explicit. Nothing is implied.

## IDs

### Requirement IDs

| Format | Meaning | Example |
|--------|---------|---------|
| `{CODE}-{n}` | Requirement | `DIFF-1` |
| `{CODE}-{n}.{p}` | Subrequirement | `DIFF-1.1` |
| `{CODE}-{n}_AC-{m}` | Acceptance criterion | `DIFF-1_AC-1` |
| `{CODE}_P-{n}` | Correctness property | `DIFF_P-2` |

`{CODE}` is a short uppercase identifier for the feature area (e.g., `DIFF`, `GEN`, `CFG`).

## Code Markers

Place these markers as comments in your source code and tests.

| Marker | Links to | Example |
|--------|----------|---------|
| `@awa-component` | Design component | `// @awa-component: DIFF-Parser` |
| `@awa-impl` | Acceptance criterion | `// @awa-impl: DIFF-1.1_AC-1` |
| `@awa-test` | Property or AC | `// @awa-test: DIFF_P-2` |

### Example: Source File

```typescript
// @awa-component: DIFF-DiffEngine
// @awa-impl: DIFF-1_AC-1
export function computeDiff(a: string, b: string): string {
  return createTwoFilesPatch('a', 'b', a, b);
}
```

### Example: Test File

```typescript
// @awa-test: DIFF-1_AC-1
test('produces unified diff for modified files', () => {
  const result = computeDiff('hello', 'world');
  expect(result).toContain('---');
  expect(result).toContain('+++');
});
```

## How to Read a Trace

### Starting from a Test

```typescript
// @awa-test: DIFF-1_AC-1
test('produces unified diff for modified files', () => { ... });
```

1. `DIFF-1_AC-1` is defined in `REQ-DIFF-*.md` under requirement `DIFF-1`
2. `DESIGN-DIFF-*.md` has a component that `IMPLEMENTS: DIFF-1_AC-1`
3. Source code is marked `@awa-impl: DIFF-1_AC-1`

### Starting from a Requirement

1. Find `DIFF-1` in `REQ-DIFF-*.md` — read what must be built
2. Find the design component in `DESIGN-DIFF-*.md` that `IMPLEMENTS: DIFF-1_AC-1`
3. Search source code for `@awa-impl: DIFF-1_AC-1` — find the implementation
4. Search tests for `@awa-test: DIFF-1_AC-1` — find the verification

## Benefits

- **Auditability** — any stakeholder can trace a line of code back to the requirement that motivated it
- **AI context** — the AI agent can see the full chain and understand why code exists
- **Gap detection** — missing `@awa-impl` or `@awa-test` markers indicate gaps in coverage
- **Change impact** — when a requirement changes, find all affected code and tests by searching for the ID

## Validation

Use `awa validate` to automatically check the integrity of the traceability chain:

```bash
awa validate              # text output
awa validate --format json # JSON output for CI
```

It checks that all `@awa-impl`, `@awa-test`, and `@awa-component` markers reference real spec IDs, flags uncovered acceptance criteria, validates IMPLEMENTS/VALIDATES cross-references between DESIGN and REQ specs, and enforces structural rules defined in `*.rules.yaml` schema files.

See the [CLI Reference](/reference/cli/) for all options and [Configuration](/reference/configuration/) for the `[validate]` config section.
