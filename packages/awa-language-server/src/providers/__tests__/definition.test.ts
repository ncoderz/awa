import { describe, expect, it } from 'vitest';
import type { LspSpecIndex } from '../../spec-index.js';
import { provideDefinition } from '../definition.js';

const FILE_PATH = '/workspace/src/impl.ts';
const FILE_URI = `file://${FILE_PATH}`;
const SPEC_PATH = '/workspace/.awa/specs/REQ-DIFF-diff.md';

function makeIndex(overrides: Partial<LspSpecIndex> = {}): LspSpecIndex {
  return {
    ids: new Map([
      [
        'DIFF-1_AC-1',
        {
          id: 'DIFF-1_AC-1',
          type: 'ac',
          text: 'Output must be valid unified diff format',
          filePath: SPEC_PATH,
          line: 42,
          featureCode: 'DIFF',
        },
      ],
    ]),
    markers: new Map([
      [FILE_PATH, [{ type: 'impl', id: 'DIFF-1_AC-1', line: 5, startColumn: 14, endColumn: 25 }]],
    ]),
    implementations: new Map(),
    tests: new Map(),
    components: new Map(),
    ...overrides,
  };
}

describe('provideDefinition', () => {
  it('returns null when no markers exist for the file', () => {
    const index = makeIndex({ markers: new Map() });
    const result = provideDefinition(FILE_URI, { line: 0, character: 0 }, index);
    expect(result).toBeNull();
  });

  it('returns null when cursor is not on a marker', () => {
    const index = makeIndex();
    const result = provideDefinition(FILE_URI, { line: 4, character: 0 }, index);
    expect(result).toBeNull();
  });

  it('returns null when ID is not in the spec index', () => {
    const index = makeIndex({ ids: new Map() });
    const result = provideDefinition(FILE_URI, { line: 4, character: 14 }, index);
    expect(result).toBeNull();
  });

  it('returns Location pointing to spec file when cursor is on a marker ID', () => {
    const index = makeIndex();
    // Marker at line=5 (1-based), so position.line=4; cursor at col=14
    const result = provideDefinition(FILE_URI, { line: 4, character: 14 }, index);
    expect(result).not.toBeNull();
    const location = result as { uri: string; range: { start: { line: number } } };
    expect(location.uri).toContain('REQ-DIFF-diff.md');
    // LSP line is 0-based; spec file line is 42 → expect 41
    expect(location.range.start.line).toBe(41);
  });

  it('jumps to correct 0-based line in spec file', () => {
    const index = makeIndex();
    const result = provideDefinition(FILE_URI, { line: 4, character: 20 }, index) as {
      range: { start: { line: number; character: number }; end: { line: number } };
    };
    expect(result.range.start.character).toBe(0);
    expect(result.range.end.line).toBe(41);
  });

  it('handles file URI encoding correctly', () => {
    const index = makeIndex();
    const result = provideDefinition(FILE_URI, { line: 4, character: 14 }, index) as {
      uri: string;
    };
    expect(result.uri).toMatch(/^file:\/\//);
  });
});
