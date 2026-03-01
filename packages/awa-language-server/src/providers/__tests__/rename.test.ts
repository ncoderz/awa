import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LspSpecIndex } from '../../spec-index.js';
import { pathToUri } from '../definition.js';
import { prepareRename, provideRename } from '../rename.js';

// ─────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────

const FILE_PATH = '/workspace/src/impl.ts';
const FILE_URI = `file://${FILE_PATH}`;

function makeIndex(overrides: Partial<LspSpecIndex> = {}): LspSpecIndex {
  return {
    ids: new Map([
      [
        'DIFF-1_AC-1',
        {
          id: 'DIFF-1_AC-1',
          type: 'ac',
          text: 'Output must be valid unified diff format',
          filePath: '/workspace/.awa/specs/REQ-DIFF-diff.md',
          line: 5,
          featureCode: 'DIFF',
        },
      ],
    ]),
    markers: new Map([
      [
        FILE_PATH,
        [
          { type: 'impl', id: 'DIFF-1_AC-1', line: 3, startColumn: 14, endColumn: 25 },
          { type: 'impl', id: 'DIFF-1_AC-1', line: 5, startColumn: 14, endColumn: 25 },
        ],
      ],
    ]),
    implementations: new Map([['DIFF-1_AC-1', [{ filePath: FILE_PATH, line: 3 }]]]),
    tests: new Map(),
    components: new Map(),
    ...overrides,
  };
}

// ─────────────────────────────────────────
// prepareRename tests
// ─────────────────────────────────────────

describe('prepareRename', () => {
  it('returns null when cursor is not on a marker', () => {
    const index = makeIndex();
    const result = prepareRename(FILE_URI, { line: 2, character: 0 }, index);
    expect(result).toBeNull();
  });

  it('returns null when marker ID is not in spec index', () => {
    const index = makeIndex({ ids: new Map() });
    const result = prepareRename(FILE_URI, { line: 2, character: 14 }, index);
    expect(result).toBeNull();
  });

  it('returns the range and current ID when cursor is on a known marker', () => {
    const index = makeIndex();
    // Marker at line=3 (1-based), col 14-25
    const result = prepareRename(FILE_URI, { line: 2, character: 14 }, index) as {
      range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
      };
      placeholder: string;
    };
    expect(result).not.toBeNull();
    expect(result.placeholder).toBe('DIFF-1_AC-1');
    expect(result.range.start.line).toBe(2);
    expect(result.range.start.character).toBe(14);
    expect(result.range.end.line).toBe(2);
    expect(result.range.end.character).toBe(25);
  });
});

// ─────────────────────────────────────────
// provideRename tests (with real spec files)
// ─────────────────────────────────────────

let workspaceRoot: string;

beforeEach(async () => {
  workspaceRoot = join(tmpdir(), `awa-rename-test-${Date.now()}`);
  await mkdir(join(workspaceRoot, '.awa', 'specs'), { recursive: true });
  await mkdir(join(workspaceRoot, 'src'), { recursive: true });
});

afterEach(async () => {
  await rm(workspaceRoot, { recursive: true, force: true });
});

function makeRealIndex(specPath: string, codePath: string): LspSpecIndex {
  return {
    ids: new Map([
      [
        'DIFF-1_AC-1',
        {
          id: 'DIFF-1_AC-1',
          type: 'ac',
          text: 'Some criterion',
          filePath: specPath,
          line: 3,
          featureCode: 'DIFF',
        },
      ],
    ]),
    markers: new Map([
      [
        codePath,
        [
          { type: 'impl', id: 'DIFF-1_AC-1', line: 1, startColumn: 14, endColumn: 25 },
          { type: 'impl', id: 'DIFF-1_AC-1', line: 2, startColumn: 14, endColumn: 25 },
        ],
      ],
    ]),
    implementations: new Map(),
    tests: new Map(),
    components: new Map(),
  };
}

describe('provideRename', () => {
  it('returns null when cursor is not on a marker', async () => {
    const index = makeIndex();
    const result = await provideRename(
      {
        textDocument: { uri: FILE_URI },
        position: { line: 0, character: 0 },
        newName: 'DIFF-1_AC-2',
      },
      index
    );
    expect(result).toBeNull();
  });

  it('returns null when newName is same as current ID', async () => {
    const index = makeIndex();
    const result = await provideRename(
      {
        textDocument: { uri: FILE_URI },
        position: { line: 2, character: 14 },
        newName: 'DIFF-1_AC-1',
      },
      index
    );
    expect(result).toBeNull();
  });

  it('returns workspace edit with code file changes', async () => {
    const specPath = join(workspaceRoot, '.awa', 'specs', 'REQ-DIFF-diff.md');
    const codePath = join(workspaceRoot, 'src', 'impl.ts');
    await writeFile(specPath, '## Reqs\n\n- DIFF-1_AC-1 Some criterion\n');

    const index = makeRealIndex(specPath, codePath);
    const codeUri = pathToUri(codePath);

    const result = await provideRename(
      {
        textDocument: { uri: codeUri },
        position: { line: 0, character: 14 },
        newName: 'DIFF-2_AC-1',
      },
      index
    );

    expect(result).not.toBeNull();
    const changes = result!.changes;
    expect(changes).toBeDefined();
    // Should have edits for the code file
    expect(changes[codeUri]).toBeDefined();
    expect(changes[codeUri]?.length).toBe(2); // 2 markers at lines 1 and 2
  });

  it('code file edits have correct replacement text and ranges', async () => {
    const specPath = join(workspaceRoot, '.awa', 'specs', 'REQ-DIFF-diff.md');
    const codePath = join(workspaceRoot, 'src', 'impl.ts');
    await writeFile(specPath, '- DIFF-1_AC-1 criterion\n');

    const index = makeRealIndex(specPath, codePath);
    const codeUri = pathToUri(codePath);

    const result = await provideRename(
      {
        textDocument: { uri: codeUri },
        position: { line: 0, character: 14 },
        newName: 'DIFF-NEW_AC-1',
      },
      index
    );

    const edits = result!.changes[codeUri]!;
    // First edit: line 0 (0-based), col 14-25 → 'DIFF-NEW_AC-1'
    expect(edits[0]?.newText).toBe('DIFF-NEW_AC-1');
    expect(edits[0]?.range.start.line).toBe(0);
    expect(edits[0]?.range.start.character).toBe(14);
  });

  it('includes spec file edits for the defining line', async () => {
    const specPath = join(workspaceRoot, '.awa', 'specs', 'REQ-DIFF-diff.md');
    const codePath = join(workspaceRoot, 'src', 'impl.ts');
    await writeFile(specPath, '## Reqs\n\n- DIFF-1_AC-1 Some criterion\n');

    const index = makeRealIndex(specPath, codePath);
    const codeUri = pathToUri(codePath);
    const specUri = pathToUri(specPath);

    const result = await provideRename(
      {
        textDocument: { uri: codeUri },
        position: { line: 0, character: 14 },
        newName: 'DIFF-1_AC-2',
      },
      index
    );

    expect(result?.changes[specUri]).toBeDefined();
    const specEdits = result!.changes[specUri]!;
    expect(specEdits.some((e) => e.newText === 'DIFF-1_AC-2')).toBe(true);
  });

  it('handles missing spec file gracefully', async () => {
    // No spec file created — index points to non-existent file
    const specPath = join(workspaceRoot, '.awa', 'specs', 'MISSING.md');
    const codePath = join(workspaceRoot, 'src', 'impl.ts');
    const index = makeRealIndex(specPath, codePath);
    const codeUri = pathToUri(codePath);

    const result = await provideRename(
      {
        textDocument: { uri: codeUri },
        position: { line: 0, character: 14 },
        newName: 'DIFF-1_AC-2',
      },
      index
    );

    // Should still return code file edits even if spec read fails
    expect(result).not.toBeNull();
    expect(result?.changes[codeUri]).toBeDefined();
  });
});
