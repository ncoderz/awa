import { describe, expect, it } from 'vitest';
import type { LspSpecIndex } from '../../spec-index.js';
import { provideCodeLens } from '../code-lens.js';

const FILE_PATH = '/workspace/src/impl.ts';
const FILE_URI = `file://${FILE_PATH}`;

function makeIndex(overrides: Partial<LspSpecIndex> = {}): LspSpecIndex {
  return {
    ids: new Map(),
    markers: new Map([
      [
        FILE_PATH,
        [
          { type: 'impl', id: 'DIFF-1_AC-1', line: 3, startColumn: 14, endColumn: 25 },
          { type: 'test', id: 'DIFF-1_AC-1', line: 7, startColumn: 14, endColumn: 25 },
          { type: 'component', id: 'DIFF-DiffEngine', line: 1, startColumn: 18, endColumn: 33 },
        ],
      ],
    ]),
    implementations: new Map([['DIFF-1_AC-1', [{ filePath: FILE_PATH, line: 3 }]]]),
    tests: new Map([
      [
        'DIFF-1_AC-1',
        [
          { filePath: '/workspace/src/impl.test.ts', line: 5 },
          { filePath: '/workspace/src/impl.test.ts', line: 12 },
        ],
      ],
    ]),
    components: new Map(),
    ...overrides,
  };
}

describe('provideCodeLens', () => {
  it('returns empty array when no markers exist for the file', () => {
    const index = makeIndex({ markers: new Map() });
    const result = provideCodeLens(FILE_URI, index);
    expect(result).toHaveLength(0);
  });

  it('only creates lenses for impl and test markers (not component)', () => {
    const index = makeIndex();
    const result = provideCodeLens(FILE_URI, index);
    // impl + test = 2 lenses; component is skipped
    expect(result).toHaveLength(2);
  });

  it('impl lens shows test count when tests exist', () => {
    const index = makeIndex();
    const lenses = provideCodeLens(FILE_URI, index);
    const implLens = lenses.find((l) => l.range.start.line === 2); // line=3 → 0-based=2
    expect(implLens?.command?.title).toContain('2 tests');
    expect(implLens?.command?.title).toContain('DIFF-1_AC-1');
  });

  it('impl lens shows "no tests" when there are none', () => {
    const index = makeIndex({ tests: new Map() });
    const lenses = provideCodeLens(FILE_URI, index);
    const implLens = lenses.find((l) => l.range.start.line === 2);
    expect(implLens?.command?.title).toContain('no tests');
  });

  it('test lens shows impl count when impls exist', () => {
    const index = makeIndex();
    const lenses = provideCodeLens(FILE_URI, index);
    const testLens = lenses.find((l) => l.range.start.line === 6); // line=7 → 0-based=6
    expect(testLens?.command?.title).toContain('1 impl');
    expect(testLens?.command?.title).toContain('DIFF-1_AC-1');
  });

  it('test lens shows "no implementations" when there are none', () => {
    const index = makeIndex({ implementations: new Map() });
    const lenses = provideCodeLens(FILE_URI, index);
    const testLens = lenses.find((l) => l.range.start.line === 6);
    expect(testLens?.command?.title).toContain('no implementations');
  });

  it('lens command is awa.trace with ID as argument', () => {
    const index = makeIndex();
    const lenses = provideCodeLens(FILE_URI, index);
    for (const lens of lenses) {
      expect(lens.command?.command).toBe('awa.trace');
      expect(lens.command?.arguments?.[0]).toBe('DIFF-1_AC-1');
    }
  });

  it('lens range starts at correct 0-based line position', () => {
    const index = makeIndex();
    const lenses = provideCodeLens(FILE_URI, index);
    const lines = lenses.map((l) => l.range.start.line).sort((a, b) => a - b);
    expect(lines).toContain(2); // impl at line 3
    expect(lines).toContain(6); // test at line 7
  });

  it('lens range character is 0', () => {
    const index = makeIndex();
    const lenses = provideCodeLens(FILE_URI, index);
    for (const lens of lenses) {
      expect(lens.range.start.character).toBe(0);
      expect(lens.range.end.character).toBe(0);
    }
  });

  it('uses singular "test" for count of 1', () => {
    const index = makeIndex({
      tests: new Map([['DIFF-1_AC-1', [{ filePath: FILE_PATH, line: 5 }]]]),
    });
    const lenses = provideCodeLens(FILE_URI, index);
    const implLens = lenses.find((l) => l.range.start.line === 2);
    expect(implLens?.command?.title).toContain('1 test');
    expect(implLens?.command?.title).not.toContain('1 tests');
  });
});
