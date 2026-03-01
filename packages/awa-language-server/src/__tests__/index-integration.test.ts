import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildLspSpecIndex, updateLspIndexForFile } from '../spec-index.js';

// ─────────────────────────────────────────
// Temp workspace setup
// ─────────────────────────────────────────

let workspaceRoot: string;

beforeEach(async () => {
  workspaceRoot = join(tmpdir(), `awa-lsp-test-${Date.now()}`);
  await mkdir(join(workspaceRoot, '.awa', 'specs'), { recursive: true });
  await mkdir(join(workspaceRoot, 'src'), { recursive: true });
});

afterEach(async () => {
  await rm(workspaceRoot, { recursive: true, force: true });
});

// ─────────────────────────────────────────
// buildLspSpecIndex tests
// ─────────────────────────────────────────

describe('buildLspSpecIndex', () => {
  it('builds an index with IDs from spec file', async () => {
    await writeFile(
      join(workspaceRoot, '.awa', 'specs', 'REQ-TST-test.md'),
      `# Test Requirements

### TST-1: First requirement

- TST-1_AC-1 First criterion
- TST-1_AC-2 Second criterion

### TST-2: Second requirement
`
    );

    const index = await buildLspSpecIndex(workspaceRoot);

    expect(index.ids.has('TST-1')).toBe(true);
    expect(index.ids.has('TST-2')).toBe(true);
    expect(index.ids.has('TST-1_AC-1')).toBe(true);
    expect(index.ids.has('TST-1_AC-2')).toBe(true);
    expect(index.ids.get('TST-1')?.text).toBe('First requirement');
    expect(index.ids.get('TST-1_AC-1')?.text).toBe('First criterion');
    expect(index.ids.get('TST-1')?.featureCode).toBe('TST');
  });

  it('builds an index with markers from code file', async () => {
    await writeFile(
      join(workspaceRoot, '.awa', 'specs', 'REQ-TST-test.md'),
      '### TST-1: Some req\n- TST-1_AC-1 Some criterion\n'
    );

    const codeFile = join(workspaceRoot, 'src', 'impl.ts');
    await writeFile(
      codeFile,
      `// @awa-component: TST-Impl
// @awa-impl: TST-1_AC-1
export function doThing() {}
`
    );

    const index = await buildLspSpecIndex(workspaceRoot);

    // Code file should be indexed with markers
    const markers = index.markers.get(codeFile);
    expect(markers).toBeDefined();
    expect(markers?.some((m) => m.id === 'TST-1_AC-1' && m.type === 'impl')).toBe(true);
    expect(markers?.some((m) => m.id === 'TST-Impl' && m.type === 'component')).toBe(true);

    // Impl location should be in index
    const implLocs = index.implementations.get('TST-1_AC-1');
    expect(implLocs).toBeDefined();
    expect(implLocs?.[0]?.filePath).toBe(codeFile);
  });

  it('returns empty index for a workspace with no spec files', async () => {
    const index = await buildLspSpecIndex(workspaceRoot);
    expect(index.ids.size).toBe(0);
    // Code files may or may not exist, but nothing references known IDs
  });

  it('index contains correct line numbers', async () => {
    await writeFile(
      join(workspaceRoot, '.awa', 'specs', 'REQ-TST-test.md'),
      `# Header

### TST-1: Req at line 3

- TST-1_AC-1 AC at line 5
`
    );

    const index = await buildLspSpecIndex(workspaceRoot);
    expect(index.ids.get('TST-1')?.line).toBe(3);
    expect(index.ids.get('TST-1_AC-1')?.line).toBe(5);
  });

  it('loads IDs from multiple spec files', async () => {
    await writeFile(join(workspaceRoot, '.awa', 'specs', 'REQ-TST-test.md'), '### TST-1: First\n');
    await writeFile(
      join(workspaceRoot, '.awa', 'specs', 'DESIGN-TST-test.md'),
      '### TST-Component\n'
    );

    const index = await buildLspSpecIndex(workspaceRoot);
    expect(index.ids.has('TST-1')).toBe(true);
    expect(index.ids.has('TST-Component')).toBe(true);
  });
});

// ─────────────────────────────────────────
// updateLspIndexForFile tests
// ─────────────────────────────────────────

describe('updateLspIndexForFile', () => {
  it('updates IDs when a spec file is modified', async () => {
    const specFile = join(workspaceRoot, '.awa', 'specs', 'REQ-TST-test.md');
    await writeFile(specFile, '### TST-1: Original title\n');

    const index = await buildLspSpecIndex(workspaceRoot);
    expect(index.ids.get('TST-1')?.text).toBe('Original title');

    // Modify the spec file
    await writeFile(specFile, '### TST-1: Updated title\n### TST-2: New requirement\n');
    await updateLspIndexForFile(specFile, index);

    expect(index.ids.get('TST-1')?.text).toBe('Updated title');
    expect(index.ids.has('TST-2')).toBe(true);
  });

  it('removes stale IDs from spec file on update', async () => {
    const specFile = join(workspaceRoot, '.awa', 'specs', 'REQ-TST-test.md');
    await writeFile(specFile, '### TST-1: Req one\n### TST-2: Req two\n');

    const index = await buildLspSpecIndex(workspaceRoot);
    expect(index.ids.has('TST-1')).toBe(true);
    expect(index.ids.has('TST-2')).toBe(true);

    // Remove TST-2 from the spec
    await writeFile(specFile, '### TST-1: Req one\n');
    await updateLspIndexForFile(specFile, index);

    expect(index.ids.has('TST-1')).toBe(true);
    expect(index.ids.has('TST-2')).toBe(false);
  });

  it('updates markers when a code file is modified', async () => {
    const codeFile = join(workspaceRoot, 'src', 'impl.ts');
    await writeFile(codeFile, '// @awa-impl: TST-1_AC-1\nexport function foo() {}\n');
    await writeFile(
      join(workspaceRoot, '.awa', 'specs', 'REQ-TST-test.md'),
      '### TST-1: Req\n- TST-1_AC-1 AC\n- TST-1_AC-2 AC2\n'
    );

    const index = await buildLspSpecIndex(workspaceRoot);
    expect(index.implementations.get('TST-1_AC-1')).toBeDefined();
    expect(index.implementations.get('TST-1_AC-2')).toBeUndefined();

    // Add another marker to the code file
    await writeFile(
      codeFile,
      '// @awa-impl: TST-1_AC-1\n// @awa-impl: TST-1_AC-2\nexport function foo() {}\n'
    );
    await updateLspIndexForFile(codeFile, index);

    expect(index.markers.get(codeFile)?.some((m) => m.id === 'TST-1_AC-1')).toBe(true);
    expect(index.markers.get(codeFile)?.some((m) => m.id === 'TST-1_AC-2')).toBe(true);
  });

  it('handles updating a non-existent file gracefully', async () => {
    const index = await buildLspSpecIndex(workspaceRoot);
    const nonExistentFile = join(workspaceRoot, 'src', 'missing.ts');
    // Should not throw
    await expect(updateLspIndexForFile(nonExistentFile, index)).resolves.toBeUndefined();
  });
});
