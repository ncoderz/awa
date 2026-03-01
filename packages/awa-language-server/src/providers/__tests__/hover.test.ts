import { describe, expect, it } from 'vitest';
import type { LspSpecIndex } from '../../spec-index.js';
import { provideHover } from '../hover.js';

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
          line: 10,
          featureCode: 'DIFF',
        },
      ],
      [
        'DIFF-DiffEngine',
        {
          id: 'DIFF-DiffEngine',
          type: 'component',
          text: 'DIFF-DiffEngine',
          filePath: '/workspace/.awa/specs/DESIGN-DIFF-diff.md',
          line: 52,
          featureCode: 'DIFF',
        },
      ],
    ]),
    markers: new Map([
      [
        FILE_PATH,
        [
          { type: 'impl', id: 'DIFF-1_AC-1', line: 3, startColumn: 14, endColumn: 25 },
          { type: 'component', id: 'DIFF-DiffEngine', line: 1, startColumn: 18, endColumn: 33 },
        ],
      ],
    ]),
    implementations: new Map([['DIFF-1_AC-1', [{ filePath: FILE_PATH, line: 3 }]]]),
    tests: new Map([['DIFF-1_AC-1', [{ filePath: '/workspace/src/impl.test.ts', line: 5 }]]]),
    components: new Map(),
    ...overrides,
  };
}

// ─────────────────────────────────────────
// Tests
// ─────────────────────────────────────────

describe('provideHover', () => {
  it('returns null when no markers exist for the file', () => {
    const index = makeIndex({ markers: new Map() });
    const result = provideHover(FILE_URI, { line: 0, character: 14 }, '', index);
    expect(result).toBeNull();
  });

  it('returns null when cursor is not on a marker', () => {
    const index = makeIndex();
    const result = provideHover(FILE_URI, { line: 0, character: 0 }, '', index);
    expect(result).toBeNull();
  });

  it('returns null when cursor is before the marker start column', () => {
    const index = makeIndex();
    // Marker at line=3 (0-based line=2), col 14
    const result = provideHover(FILE_URI, { line: 2, character: 13 }, '', index);
    expect(result).toBeNull();
  });

  it('returns null when cursor is at or past the marker end column', () => {
    const index = makeIndex();
    // Marker endColumn=25, so character=25 is past end
    const result = provideHover(FILE_URI, { line: 2, character: 25 }, '', index);
    expect(result).toBeNull();
  });

  it('returns hover content for a known ID', () => {
    const index = makeIndex();
    // Marker: line=3 (1-based) → position.line=2, startColumn=14, endColumn=25
    const result = provideHover(FILE_URI, { line: 2, character: 14 }, '', index);
    expect(result).not.toBeNull();
    const hover = result!;
    expect(typeof hover.contents === 'object').toBe(true);
    const contents = hover.contents as { kind: string; value: string };
    expect(contents.kind).toBe('markdown');
    expect(contents.value).toContain('DIFF-1_AC-1');
    expect(contents.value).toContain('Output must be valid unified diff format');
    expect(contents.value).toContain('DIFF');
    expect(contents.value).toContain('Acceptance Criterion');
  });

  it('includes impl and test counts in hover content', () => {
    const index = makeIndex();
    const result = provideHover(FILE_URI, { line: 2, character: 14 }, '', index);
    const contents = (result!.contents as { value: string }).value;
    expect(contents).toContain('1 impl');
    expect(contents).toContain('1 test');
  });

  it('omits impl/test count line when there are none', () => {
    const index = makeIndex({
      implementations: new Map(),
      tests: new Map(),
    });
    const result = provideHover(FILE_URI, { line: 2, character: 14 }, '', index);
    const contents = (result!.contents as { value: string }).value;
    expect(contents).not.toContain('impl');
    expect(contents).not.toContain('test');
  });

  it('returns "not found" hover for an orphaned marker', () => {
    const index = makeIndex({ ids: new Map() });
    const result = provideHover(FILE_URI, { line: 2, character: 14 }, '', index);
    expect(result).not.toBeNull();
    const contents = (result!.contents as { value: string }).value;
    expect(contents).toContain('not found');
  });

  it('handles file:// URI correctly', () => {
    const index = makeIndex();
    // cursor on component marker at line=1, col=18 (line+1=0 in 0-based)
    const result = provideHover(FILE_URI, { line: 0, character: 18 }, '', index);
    expect(result).not.toBeNull();
    const contents = (result!.contents as { value: string }).value;
    expect(contents).toContain('DIFF-DiffEngine');
    expect(contents).toContain('Design Component');
  });

  it('hover content contains file path reference', () => {
    const index = makeIndex();
    const result = provideHover(FILE_URI, { line: 2, character: 14 }, '', index);
    const contents = (result!.contents as { value: string }).value;
    // Should contain relative path display
    expect(contents).toContain('.awa/specs/REQ-DIFF-diff.md');
  });
});
