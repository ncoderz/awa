import { describe, expect, it } from 'vitest';
import type { LspSpecIndex } from '../../spec-index.js';
import { provideDiagnostics } from '../diagnostics.js';

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
          text: 'Some criterion',
          filePath: '/workspace/.awa/specs/REQ-DIFF-diff.md',
          line: 10,
          featureCode: 'DIFF',
        },
      ],
    ]),
    markers: new Map([
      [
        FILE_PATH,
        [
          { type: 'impl', id: 'DIFF-1_AC-1', line: 3, startColumn: 14, endColumn: 25 },
          { type: 'impl', id: 'UNKNOWN-9_AC-9', line: 5, startColumn: 14, endColumn: 28 },
        ],
      ],
    ]),
    implementations: new Map(),
    tests: new Map(),
    components: new Map(),
    ...overrides,
  };
}

describe('provideDiagnostics', () => {
  it('returns empty array when no markers exist for the file', () => {
    const index = makeIndex({ markers: new Map() });
    const result = provideDiagnostics(FILE_URI, index);
    expect(result).toHaveLength(0);
  });

  it('returns no diagnostics when all markers are defined', () => {
    const index = makeIndex({
      markers: new Map([
        [FILE_PATH, [{ type: 'impl', id: 'DIFF-1_AC-1', line: 3, startColumn: 14, endColumn: 25 }]],
      ]),
    });
    const result = provideDiagnostics(FILE_URI, index);
    expect(result).toHaveLength(0);
  });

  it('returns an error diagnostic for each orphaned marker', () => {
    const index = makeIndex();
    const result = provideDiagnostics(FILE_URI, index);
    // Only UNKNOWN-9_AC-9 is orphaned
    expect(result).toHaveLength(1);
    expect(result[0]?.code).toBe('orphaned-marker');
    expect(result[0]?.message).toContain('UNKNOWN-9_AC-9');
    expect(result[0]?.source).toBe('awa');
  });

  it('sets error severity on orphaned markers', () => {
    const index = makeIndex();
    const result = provideDiagnostics(FILE_URI, index);
    // DiagnosticSeverity.Error = 1
    expect(result[0]?.severity).toBe(1);
  });

  it('diagnostic range matches marker position (0-based lines)', () => {
    const index = makeIndex();
    const diag = provideDiagnostics(FILE_URI, index)[0]!;
    // Marker line=5 (1-based) → 0-based = 4
    expect(diag.range.start.line).toBe(4);
    expect(diag.range.start.character).toBe(14);
    expect(diag.range.end.line).toBe(4);
    expect(diag.range.end.character).toBe(28);
  });

  it('returns diagnostics for all orphaned markers in a file', () => {
    const index = makeIndex({ ids: new Map() });
    const result = provideDiagnostics(FILE_URI, index);
    expect(result).toHaveLength(2); // both markers are orphaned
  });

  it('handles files with no markers returning empty array', () => {
    const index = makeIndex({ markers: new Map([[FILE_PATH, []]]) });
    const result = provideDiagnostics(FILE_URI, index);
    expect(result).toHaveLength(0);
  });
});
