import { describe, expect, test } from 'vitest';
import { resolveIds, resolveSourceFile, resolveTaskFile } from '../input-resolver.js';
import type { TraceIndex } from '../types.js';

// @awa-test: TRC-2_AC-1, TRC-2_AC-2, TRC-2_AC-3

/** Minimal TraceIndex with just the allIds set populated. */
function makeIndex(ids: string[]): TraceIndex {
  const allIds = new Set(ids);
  return {
    reqToACs: new Map(),
    acToDesignComponents: new Map(),
    acToCodeLocations: new Map(),
    acToTestLocations: new Map(),
    propertyToTestLocations: new Map(),
    componentToCodeLocations: new Map(),
    acToReq: new Map(),
    componentToACs: new Map(),
    propertyToACs: new Map(),
    idLocations: new Map(),
    allIds,
  };
}

describe('resolveIds', () => {
  test('returns IDs that exist in the index', () => {
    const index = makeIndex(['DIFF-1', 'DIFF-1_AC-1', 'DIFF_P-1']);
    const result = resolveIds(['DIFF-1', 'DIFF-1_AC-1'], index);

    expect(result.ids).toEqual(['DIFF-1', 'DIFF-1_AC-1']);
    expect(result.warnings).toEqual([]);
  });

  test('warns for IDs not in index', () => {
    const index = makeIndex(['DIFF-1']);
    const result = resolveIds(['DIFF-1', 'NOPE-99'], index);

    expect(result.ids).toEqual(['DIFF-1']);
    expect(result.warnings).toEqual(["ID 'NOPE-99' not found in any spec or code"]);
  });

  test('handles empty input', () => {
    const index = makeIndex(['DIFF-1']);
    const result = resolveIds([], index);

    expect(result.ids).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

// @awa-test: TRC-2_AC-2
describe('resolveTaskFile', () => {
  test('extracts IDs from IMPLEMENTS and TESTS lines', async () => {
    const fs = await import('node:fs/promises');
    const os = await import('node:os');
    const path = await import('node:path');

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trace-test-'));
    const taskPath = path.join(tmpDir, 'TASK-DIFF-diff-001.md');

    await fs.writeFile(
      taskPath,
      `# Implementation Tasks

FEATURE: Diff
SOURCE: REQ-DIFF-diff.md, DESIGN-DIFF-diff.md

## Phase 1: Setup

- [ ] T-DIFF-001 Initialize module → src/core/differ.ts

## Phase 2: Core [MUST]

GOAL: Implement diff
TEST CRITERIA: Diff works

- [ ] T-DIFF-010 [DIFF-1] Implement diff → src/core/differ.ts
  IMPLEMENTS: DIFF-1_AC-1
- [ ] T-DIFF-011 [DIFF-1] Test diff → src/core/__tests__/differ.test.ts
  TESTS: DIFF-1_AC-1, DIFF_P-1

## Dependencies

DIFF-1 → (none)

## Parallel Opportunities

Phase 2: T-DIFF-011 after T-DIFF-010

## Requirements Traceability

### REQ-DIFF-diff.md

- DIFF-1_AC-1 → T-DIFF-010 (T-DIFF-011)
- DIFF_P-1 → T-DIFF-011

UNCOVERED: (none)
`
    );

    const index = makeIndex(['DIFF-1_AC-1', 'DIFF_P-1', 'DIFF-1']);
    const result = await resolveTaskFile(taskPath, index);

    expect(result.ids).toContain('DIFF-1_AC-1');
    expect(result.ids).toContain('DIFF_P-1');
    expect(result.warnings).toEqual([]);

    // Cleanup
    await fs.rm(tmpDir, { recursive: true });
  });

  test('warns when task file does not exist', async () => {
    const index = makeIndex(['DIFF-1']);
    const result = await resolveTaskFile('/nonexistent/TASK.md', index);

    expect(result.ids).toEqual([]);
    expect(result.warnings).toEqual(['Task file not found: /nonexistent/TASK.md']);
  });
});

// @awa-test: TRC-2_AC-3
describe('resolveSourceFile', () => {
  test('extracts IDs from @awa-* markers', async () => {
    const fs = await import('node:fs/promises');
    const os = await import('node:os');
    const path = await import('node:path');

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trace-test-'));
    const srcPath = path.join(tmpDir, 'differ.ts');

    await fs.writeFile(
      srcPath,
      `// @awa-component: DIFF-DiffEngine
// @awa-impl: DIFF-1_AC-1
export function diff() {}

// @awa-impl: DIFF-1_AC-2
export function patch() {}
`
    );

    const index = makeIndex(['DIFF-DiffEngine', 'DIFF-1_AC-1', 'DIFF-1_AC-2']);
    const result = await resolveSourceFile(srcPath, index);

    expect(result.ids).toContain('DIFF-DiffEngine');
    expect(result.ids).toContain('DIFF-1_AC-1');
    expect(result.ids).toContain('DIFF-1_AC-2');
    expect(result.warnings).toEqual([]);

    await fs.rm(tmpDir, { recursive: true });
  });

  test('warns when source file does not exist', async () => {
    const index = makeIndex(['DIFF-1']);
    const result = await resolveSourceFile('/nonexistent/file.ts', index);

    expect(result.ids).toEqual([]);
    expect(result.warnings).toEqual(['Source file not found: /nonexistent/file.ts']);
  });

  test('warns when file has no markers', async () => {
    const fs = await import('node:fs/promises');
    const os = await import('node:os');
    const path = await import('node:path');

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trace-test-'));
    const srcPath = path.join(tmpDir, 'empty.ts');

    await fs.writeFile(srcPath, 'export const x = 1;\n');

    const index = makeIndex(['DIFF-1']);
    const result = await resolveSourceFile(srcPath, index);

    expect(result.ids).toEqual([]);
    expect(result.warnings).toEqual([`No traceability markers found in file: ${srcPath}`]);

    await fs.rm(tmpDir, { recursive: true });
  });
});
