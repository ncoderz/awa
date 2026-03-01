// @awa-component: CHK-CheckCommand
// @awa-test: CHK-8_AC-1
// @awa-test: CHK-10_AC-1
// @awa-test: CHK-16_AC-1
// @awa-test: CHK_P-5
// @awa-test: CHK-12_AC-1, CHK-13_AC-1, CHK-14_AC-1, CHK-15_AC-1
// @awa-test: CHK-17_AC-1, CHK-17_AC-2, CHK-17_AC-3

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { checkCommand } from '../check.js';

describe('checkCommand', () => {
  let testDir: string;
  let specDir: string;
  let codeDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `awa-check-cmd-test-${Date.now()}`);
    specDir = join(testDir, '.awa', 'specs');
    codeDir = join(testDir, 'src');
    await mkdir(specDir, { recursive: true });
    await mkdir(codeDir, { recursive: true });
    process.chdir(testDir);

    // Suppress console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    await rm(testDir, { recursive: true, force: true });
  });

  // @awa-test: CHK_P-5
  // @awa-test: CHK-8_AC-1
  test('returns exit code 0 when all markers resolve', async () => {
    await writeFile(
      join(specDir, 'REQ-X-x.md'),
      `### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(specDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );
    // @awa-ignore-start
    await writeFile(
      join(codeDir, 'loader.ts'),
      `// @awa-component: X-Loader
// @awa-impl: X-1_AC-1
export function load() {}
`
    );
    await writeFile(
      join(codeDir, 'loader.test.ts'),
      `// @awa-test: X_P-1
// @awa-test: X-1_AC-1
test('works', () => {});
`
    );
    // @awa-ignore-end

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
    });

    // No orphaned markers, all ACs tested, cross-refs valid
    expect(exitCode).toBe(0);
  });

  // @awa-test: CHK_P-5
  // @awa-test: CHK-8_AC-1
  test('returns exit code 1 when orphaned markers exist', async () => {
    // @awa-ignore-start
    await writeFile(
      join(codeDir, 'broken.ts'),
      `// @awa-impl: GHOST-1_AC-1
export function ghost() {}
`
    );
    // @awa-ignore-end

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
    });

    expect(exitCode).toBe(1);
  });

  // @awa-test: CHK-16_AC-1
  test('works with default config (no .awa.toml)', async () => {
    // Should not throw even without config file
    const exitCode = await checkCommand({
      config: undefined,
    });

    // Returns 0 or 1 (not 2 for error)
    expect(exitCode).toBeLessThanOrEqual(1);
  });

  // @awa-test: CHK-10_AC-1
  test('respects --code-ignore patterns', async () => {
    // @awa-ignore-start
    await writeFile(
      join(codeDir, 'ignored.ts'),
      `// @awa-impl: GHOST-1_AC-1
export function ghost() {}
`
    );
    // @awa-ignore-end

    const exitCode = await checkCommand({
      config: undefined,
      codeIgnore: ['src/**'],
      format: 'json',
    });

    // With code dir ignored, no orphaned markers to find
    expect(exitCode).toBe(0);
  });

  // --- Schema validation integration tests ---

  // @awa-test: CHK-8_AC-1
  test('schema validation: conforming Markdown produces no schema findings', async () => {
    // Create schema rules directory and rule file
    const schemaDir = join(testDir, '.awa', '.agent', 'schemas');
    await mkdir(schemaDir, { recursive: true });

    await writeFile(
      join(schemaDir, 'REQ.schema.yaml'),
      `target-files: ".awa/specs/REQ-*.md"
sections:
  - heading: ".*"
    level: 1
    required: true
  - heading: ".*"
    level: 3
    required: true
    repeatable: true
    contains:
      - pattern: "ACCEPTANCE CRITERIA"
        label: "AC section"
`
    );

    // Create a conforming spec file
    await writeFile(
      join(specDir, 'REQ-X-x.md'),
      `# Requirements

### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );

    // Also need code/tests to avoid orphan findings
    await writeFile(
      join(specDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );
    // @awa-ignore-start
    await writeFile(
      join(codeDir, 'loader.ts'),
      `// @awa-component: X-Loader
// @awa-impl: X-1_AC-1
export function load() {}
`
    );
    await writeFile(
      join(codeDir, 'loader.test.ts'),
      `// @awa-test: X_P-1
// @awa-test: X-1_AC-1
test('works', () => {});
`
    );
    // @awa-ignore-end

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
    });

    expect(exitCode).toBe(0);
  });

  // @awa-test: CHK-8_AC-1
  test('schema validation: non-conforming Markdown produces schema findings', async () => {
    const schemaDir = join(testDir, '.awa', '.agent', 'schemas');
    await mkdir(schemaDir, { recursive: true });

    await writeFile(
      join(schemaDir, 'REQ.schema.yaml'),
      `target-files: ".awa/specs/REQ-*.md"
sections:
  - heading: "Requirements"
    level: 1
    required: true
    contains:
      - pattern: "OVERVIEW"
        label: "Overview subsection"
`
    );

    // Create a non-conforming spec file (missing "Requirements" H1 and "OVERVIEW" text)
    await writeFile(
      join(specDir, 'REQ-Y-y.md'),
      `# Something Else

### Y-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] Y-1_AC-1 [event]: WHEN foo THEN bar
`
    );

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
    });

    // Should produce schema findings (error exit code 1)
    expect(exitCode).toBe(1);

    // Verify JSON output includes schema finding codes
    const jsonOutput = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0])
      .find((s: unknown) => typeof s === 'string' && s.includes('"findings"'));
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput as string);
    const schemaCodes = parsed.findings
      .map((f: { code: string }) => f.code)
      .filter((c: string) => c.startsWith('schema-'));
    expect(schemaCodes.length).toBeGreaterThan(0);
  });

  // @awa-test: CHK-8_AC-1
  test('schema validation: schema-enabled = false skips schema checking', async () => {
    const schemaDir = join(testDir, '.awa', '.agent', 'schemas');
    await mkdir(schemaDir, { recursive: true });

    // Create a rule that would fail
    await writeFile(
      join(schemaDir, 'REQ.schema.yaml'),
      `target-files: ".awa/specs/REQ-*.md"
sections:
  - heading: "Required Section"
    level: 1
    required: true
`
    );

    // Create a spec file that does NOT conform (missing "Required Section")
    await writeFile(join(specDir, 'REQ-Z-z.md'), '# Unrelated Title\n');

    // Create config file with schema-enabled = false
    await writeFile(
      join(testDir, '.awa.toml'),
      `[check]
schema-enabled = false
`
    );

    const exitCode = await checkCommand({
      config: join(testDir, '.awa.toml'),
      format: 'json',
      allowWarnings: true,
    });

    // Should pass — schema checking skipped entirely
    expect(exitCode).toBe(0);

    // Verify no schema findings in output
    const jsonOutput = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0])
      .find((s: unknown) => typeof s === 'string' && s.includes('"findings"'));
    if (jsonOutput) {
      const parsed = JSON.parse(jsonOutput as string);
      const schemaCodes = parsed.findings
        .map((f: { code: string }) => f.code)
        .filter((c: string) => c.startsWith('schema-'));
      expect(schemaCodes).toHaveLength(0);
    }
  });

  // --- allow-warnings tests ---

  // @awa-test: CHK-17_AC-1, CHK-17_AC-3
  test('returns exit code 1 when warnings exist and allow-warnings is false (default)', async () => {
    // Create a spec file that will generate an orphaned-spec warning (code Z not referenced)
    await writeFile(join(specDir, 'REQ-Z-z.md'), '# Title\n');

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
    });

    // Warnings are errors by default
    expect(exitCode).toBe(1);
  });

  // @awa-test: CHK-17_AC-1
  test('returns exit code 0 when only warnings exist and allow-warnings is true', async () => {
    // Create a spec file that will generate an orphaned-spec warning (code Z not referenced)
    await writeFile(join(specDir, 'REQ-Z-z.md'), '# Title\n');

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
      allowWarnings: true,
    });

    // Warnings allowed, no errors → exit 0
    expect(exitCode).toBe(0);
  });

  // @awa-test: CHK-17_AC-2
  test('reads allow-warnings from config file', async () => {
    await writeFile(join(specDir, 'REQ-Z-z.md'), '# Title\n');
    await writeFile(
      join(testDir, '.awa.toml'),
      `[check]
allow-warnings = true
`
    );

    const exitCode = await checkCommand({
      config: join(testDir, '.awa.toml'),
      format: 'json',
    });

    expect(exitCode).toBe(0);
  });

  // --- Configurable globs and patterns tests ---

  // @awa-test: CHK-12_AC-1
  test('uses custom spec-globs from config', async () => {
    // Put spec in a custom directory
    const customSpecDir = join(testDir, 'custom-specs');
    await mkdir(customSpecDir, { recursive: true });
    await writeFile(
      join(customSpecDir, 'REQ-X-x.md'),
      `### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(customSpecDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );
    // @awa-ignore-start
    await writeFile(
      join(codeDir, 'loader.ts'),
      `// @awa-component: X-Loader
// @awa-impl: X-1_AC-1
export function load() {}
`
    );
    await writeFile(
      join(codeDir, 'loader.test.ts'),
      `// @awa-test: X_P-1
// @awa-test: X-1_AC-1
test('works', () => {});
`
    );
    // @awa-ignore-end

    await writeFile(
      join(testDir, '.awa.toml'),
      `[check]
spec-globs = ["custom-specs/**/*.md"]
`
    );

    const exitCode = await checkCommand({
      config: join(testDir, '.awa.toml'),
      format: 'json',
    });

    expect(exitCode).toBe(0);
  });

  // @awa-test: CHK-13_AC-1
  test('uses custom code-globs from config', async () => {
    const customCodeDir = join(testDir, 'custom-code');
    await mkdir(customCodeDir, { recursive: true });
    await writeFile(
      join(specDir, 'REQ-X-x.md'),
      `### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(specDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );
    // @awa-ignore-start
    await writeFile(
      join(customCodeDir, 'loader.ts'),
      `// @awa-component: X-Loader
// @awa-impl: X-1_AC-1
export function load() {}
`
    );
    await writeFile(
      join(customCodeDir, 'loader.test.ts'),
      `// @awa-test: X_P-1
// @awa-test: X-1_AC-1
test('works', () => {});
`
    );
    // @awa-ignore-end

    await writeFile(
      join(testDir, '.awa.toml'),
      `[check]
code-globs = ["custom-code/**/*.ts"]
`
    );

    const exitCode = await checkCommand({
      config: join(testDir, '.awa.toml'),
      format: 'json',
    });

    expect(exitCode).toBe(0);
  });

  // @awa-test: CHK-14_AC-1
  test('uses custom id-pattern from config', async () => {
    await writeFile(
      join(specDir, 'REQ-X-x.md'),
      `### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(specDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );
    // @awa-ignore-start
    await writeFile(
      join(codeDir, 'loader.ts'),
      `// @awa-component: X-Loader
// @awa-impl: X-1_AC-1
export function load() {}
`
    );
    await writeFile(
      join(codeDir, 'loader.test.ts'),
      `// @awa-test: X_P-1
// @awa-test: X-1_AC-1
test('works', () => {});
`
    );
    // @awa-ignore-end

    // Custom id-pattern that matches our test IDs — use a broad pattern
    await writeFile(join(testDir, '.awa.toml'), '[check]\nid-pattern = "^[A-Z]"\n');

    const exitCode = await checkCommand({
      config: join(testDir, '.awa.toml'),
      format: 'json',
      allowWarnings: true,
    });

    // Verify the custom id-pattern was used by checking no id-format errors
    const jsonOutput = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0])
      .find((s: unknown) => typeof s === 'string' && s.includes('"findings"'));
    if (jsonOutput) {
      const parsed = JSON.parse(jsonOutput as string);
      const idFormatErrors = parsed.findings.filter(
        (f: { code: string }) => f.code === 'id-format-invalid'
      );
      expect(idFormatErrors).toHaveLength(0);
    }
    expect(exitCode).toBeLessThanOrEqual(1);
  });

  // @awa-test: CHK-15_AC-1
  test('uses custom cross-ref-patterns from config', async () => {
    await writeFile(
      join(specDir, 'REQ-X-x.md'),
      `### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(specDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );
    // @awa-ignore-start
    await writeFile(
      join(codeDir, 'loader.ts'),
      `// @awa-component: X-Loader
// @awa-impl: X-1_AC-1
export function load() {}
`
    );
    await writeFile(
      join(codeDir, 'loader.test.ts'),
      `// @awa-test: X_P-1
// @awa-test: X-1_AC-1
test('works', () => {});
`
    );
    // @awa-ignore-end

    await writeFile(
      join(testDir, '.awa.toml'),
      `[check]
cross-ref-patterns = ["IMPLEMENTS", "VALIDATES"]
`
    );

    const exitCode = await checkCommand({
      config: join(testDir, '.awa.toml'),
      format: 'json',
    });

    expect(exitCode).toBe(0);
  });

  // --- spec-only tests ---

  test('--spec-only skips code-to-spec checks (uncovered ACs do not fail)', async () => {
    // Create spec with ACs but NO code or tests — normally would fail
    await writeFile(
      join(specDir, 'REQ-X-x.md'),
      `### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(specDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
      specOnly: true,
    });

    // With --spec-only, no uncovered-ac or orphaned-marker errors
    expect(exitCode).toBe(0);
  });

  test('--spec-only still catches broken cross-refs', async () => {
    await writeFile(
      join(specDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: GHOST-99_AC-1
`
    );

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
      specOnly: true,
    });

    // Broken cross-ref is a spec-to-spec error — still reported
    expect(exitCode).toBe(1);
  });

  test('--spec-only skips orphaned-spec warnings', async () => {
    // A standalone REQ with no DESIGN and no code — normally an orphaned-spec warning
    await writeFile(join(specDir, 'REQ-Z-z.md'), '# Title\n');

    const exitCode = await checkCommand({
      config: undefined,
      format: 'json',
      specOnly: true,
    });

    // With --spec-only, orphaned-spec is skipped entirely
    expect(exitCode).toBe(0);
  });

  test('reads spec-only from config file', async () => {
    await writeFile(
      join(specDir, 'REQ-X-x.md'),
      `### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(testDir, '.awa.toml'),
      `[check]
spec-only = true
`
    );

    const exitCode = await checkCommand({
      config: join(testDir, '.awa.toml'),
      format: 'json',
    });

    // Config-driven spec-only should skip code checks
    expect(exitCode).toBe(0);
  });
});
