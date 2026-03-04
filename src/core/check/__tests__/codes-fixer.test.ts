// @awa-component: CLI-CodesFixer
// @awa-test: CLI-40_AC-1
// @awa-test: CLI-40_AC-2

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { fixCodesTable } from '../codes-fixer.js';
import type { SpecFile, SpecParseResult } from '../types.js';

// Mock scanCodes to avoid needing real FEAT/REQ/DESIGN files for scope extraction
vi.mock('../../codes/scanner.js', () => ({
  scanCodes: vi.fn(),
}));

/** Default docs value for test FeatureCode objects. */
const d = { feat: true, req: true, design: true, api: false, example: false } as const;

import { scanCodes } from '../../codes/scanner.js';

describe('CodesFixer', () => {
  let testDir: string;
  let specDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-codes-fixer-test-${Date.now()}`);
    specDir = join(testDir, '.awa', 'specs');
    await mkdir(specDir, { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  function makeSpecs(specFiles: SpecFile[]): SpecParseResult {
    const requirementIds = new Set<string>();
    const acIds = new Set<string>();
    const propertyIds = new Set<string>();
    const componentNames = new Set<string>();
    const idLocations = new Map<string, { filePath: string; line: number }>();

    for (const sf of specFiles) {
      for (const id of sf.requirementIds) requirementIds.add(id);
      for (const id of sf.acIds) acIds.add(id);
      for (const id of sf.propertyIds) propertyIds.add(id);
      for (const name of sf.componentNames) componentNames.add(name);
    }

    const allIds = new Set([...requirementIds, ...acIds, ...propertyIds, ...componentNames]);
    return { requirementIds, acIds, propertyIds, componentNames, allIds, specFiles, idLocations };
  }

  function makeSpecFile(overrides: Partial<SpecFile>): SpecFile {
    return {
      filePath: '',
      code: '',
      requirementIds: [],
      acIds: [],
      propertyIds: [],
      componentNames: [],
      crossRefs: [],
      ...overrides,
    };
  }

  const defaultConfig = { specGlobs: ['.awa/specs/FEAT-*.md'], specIgnore: [] as string[] };

  test('generates table from spec data', async () => {
    const archPath = join(specDir, 'ARCHITECTURE.md');
    await writeFile(
      archPath,
      `# Architecture

## Feature Codes

Old content here.

## Technology Stack

| Tech | Purpose |
`
    );

    const specs = makeSpecs([makeSpecFile({ filePath: archPath, code: '' })]);

    vi.mocked(scanCodes).mockResolvedValue({
      codes: [
        { code: 'CHK', feature: 'check', reqCount: 5, scope: 'Traceability validation.', docs: d },
        {
          code: 'TRC',
          feature: 'trace',
          reqCount: 3,
          scope: 'ID lookup, content assembly.',
          docs: d,
        },
      ],
    });

    const result = await fixCodesTable(specs, defaultConfig);

    expect(result.filesFixed).toBe(1);
    expect(result.fileResults[0]?.changed).toBe(true);
    expect(result.emptyScopeCodes).toEqual([]);

    const content = await readFile(archPath, 'utf-8');
    expect(content).toContain('| CHK | check | Traceability validation. |');
    expect(content).toContain('| TRC | trace | ID lookup, content assembly. |');
    expect(content).not.toContain('Old content here.');
    // Verify the section after is preserved
    expect(content).toContain('## Technology Stack');
  });

  test('adds new code rows', async () => {
    const archPath = join(specDir, 'ARCHITECTURE.md');
    await writeFile(
      archPath,
      `# Architecture

## Feature Codes

| Code | Feature | Scope Boundary |
|------|---------|----------------|
| CHK | check | Validation. |

## Next Section
`
    );

    const specs = makeSpecs([makeSpecFile({ filePath: archPath, code: '' })]);

    vi.mocked(scanCodes).mockResolvedValue({
      codes: [
        { code: 'CHK', feature: 'check', reqCount: 5, scope: 'Validation.', docs: d },
        { code: 'TRC', feature: 'trace', reqCount: 3, scope: 'Trace navigation.', docs: d },
      ],
    });

    const result = await fixCodesTable(specs, defaultConfig);

    expect(result.filesFixed).toBe(1);
    const content = await readFile(archPath, 'utf-8');
    expect(content).toContain('| TRC | trace | Trace navigation. |');
    expect(content).toContain('| CHK | check | Validation. |');
  });

  test('removes stale code rows', async () => {
    const archPath = join(specDir, 'ARCHITECTURE.md');
    await writeFile(
      archPath,
      `# Architecture

## Feature Codes

| Code | Feature | Scope Boundary |
|------|---------|----------------|
| CHK | check | Validation. |
| OLD | stale | Should be removed. |

## Next Section
`
    );

    const specs = makeSpecs([makeSpecFile({ filePath: archPath, code: '' })]);

    vi.mocked(scanCodes).mockResolvedValue({
      codes: [{ code: 'CHK', feature: 'check', reqCount: 5, scope: 'Validation.', docs: d }],
    });

    const result = await fixCodesTable(specs, defaultConfig);

    expect(result.filesFixed).toBe(1);
    const content = await readFile(archPath, 'utf-8');
    expect(content).toContain('| CHK | check | Validation. |');
    expect(content).not.toContain('OLD');
    expect(content).not.toContain('stale');
  });

  test('does nothing when no Feature Codes section', async () => {
    const archPath = join(specDir, 'ARCHITECTURE.md');
    await writeFile(
      archPath,
      `# Architecture

## Technology Stack

Content here.
`
    );

    const specs = makeSpecs([makeSpecFile({ filePath: archPath, code: '' })]);

    const result = await fixCodesTable(specs, defaultConfig);

    expect(result.filesFixed).toBe(0);
    expect(result.fileResults).toEqual([]);
  });

  test('populates empty table from specs', async () => {
    const archPath = join(specDir, 'ARCHITECTURE.md');
    await writeFile(
      archPath,
      `# Architecture

## Feature Codes

## Next Section
`
    );

    const specs = makeSpecs([makeSpecFile({ filePath: archPath, code: '' })]);

    vi.mocked(scanCodes).mockResolvedValue({
      codes: [{ code: 'CLI', feature: 'cli', reqCount: 2, scope: 'CLI parsing.', docs: d }],
    });

    const result = await fixCodesTable(specs, defaultConfig);

    expect(result.filesFixed).toBe(1);
    const content = await readFile(archPath, 'utf-8');
    expect(content).toContain('| Code | Feature | Scope Boundary |');
    expect(content).toContain('| CLI | cli | CLI parsing. |');
  });

  test('reports empty scope codes', async () => {
    const archPath = join(specDir, 'ARCHITECTURE.md');
    await writeFile(
      archPath,
      `# Architecture

## Feature Codes

Old table.

## Next
`
    );

    const specs = makeSpecs([makeSpecFile({ filePath: archPath, code: '' })]);

    vi.mocked(scanCodes).mockResolvedValue({
      codes: [
        { code: 'CHK', feature: 'check', reqCount: 5, scope: 'Has scope.', docs: d },
        { code: 'NEW', feature: 'new-thing', reqCount: 1, scope: '', docs: d },
      ],
    });

    const result = await fixCodesTable(specs, defaultConfig);

    expect(result.emptyScopeCodes).toEqual(['NEW']);
  });

  test('does nothing when ARCHITECTURE.md is missing', async () => {
    const specs = makeSpecs([]);

    const result = await fixCodesTable(specs, defaultConfig);

    expect(result.filesFixed).toBe(0);
    expect(result.fileResults).toEqual([]);
  });

  test('no change when table already matches', async () => {
    const archPath = join(specDir, 'ARCHITECTURE.md');
    const tableContent = `# Architecture

## Feature Codes

Run \`awa spec codes\` for the live inventory. The table below defines scope boundaries.

| Code | Feature | Scope Boundary |
|------|---------|----------------|
| CHK | check | Validation. |

## Next Section
`;
    await writeFile(archPath, tableContent);

    const specs = makeSpecs([makeSpecFile({ filePath: archPath, code: '' })]);

    vi.mocked(scanCodes).mockResolvedValue({
      codes: [{ code: 'CHK', feature: 'check', reqCount: 5, scope: 'Validation.', docs: d }],
    });

    const result = await fixCodesTable(specs, defaultConfig);

    expect(result.filesFixed).toBe(0);
    expect(result.fileResults[0]?.changed).toBe(false);
  });
});
