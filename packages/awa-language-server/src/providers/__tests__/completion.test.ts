import { describe, expect, it } from 'vitest';
import type { LspSpecIndex } from '../../spec-index.js';
import { provideCompletion } from '../completion.js';

function makeIndex(): LspSpecIndex {
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
        'DIFF_P-1',
        {
          id: 'DIFF_P-1',
          type: 'property',
          text: 'DiffIsIdempotent',
          filePath: '/workspace/.awa/specs/DESIGN-DIFF-diff.md',
          line: 30,
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
      [
        'DIFF-1',
        {
          id: 'DIFF-1',
          type: 'requirement',
          text: 'Produces unified diff',
          filePath: '/workspace/.awa/specs/REQ-DIFF-diff.md',
          line: 5,
          featureCode: 'DIFF',
        },
      ],
    ]),
    markers: new Map(),
    implementations: new Map([['DIFF-1_AC-1', [{ filePath: '/workspace/src/impl.ts', line: 3 }]]]),
    tests: new Map(),
    components: new Map(),
  };
}

describe('provideCompletion', () => {
  it('returns empty array when line has no trigger pattern', () => {
    const index = makeIndex();
    const result = provideCompletion({ line: 5, character: 10 }, '  // normal comment', index);
    expect(result).toHaveLength(0);
  });

  it('returns AC and property IDs after @awa-impl: trigger', () => {
    const index = makeIndex();
    const result = provideCompletion({ line: 5, character: 20 }, '// @awa-impl: ', index);
    const ids = result.map((item) => item.label);
    expect(ids).toContain('DIFF-1_AC-1');
    expect(ids).toContain('DIFF_P-1');
    // Should NOT include components or requirements
    expect(ids).not.toContain('DIFF-DiffEngine');
    expect(ids).not.toContain('DIFF-1');
  });

  it('returns AC and property IDs after @awa-test: trigger', () => {
    const index = makeIndex();
    const result = provideCompletion({ line: 0, character: 15 }, '// @awa-test: ', index);
    const ids = result.map((item) => item.label);
    expect(ids).toContain('DIFF-1_AC-1');
    expect(ids).toContain('DIFF_P-1');
    expect(ids).not.toContain('DIFF-DiffEngine');
  });

  it('returns component IDs after @awa-component: trigger', () => {
    const index = makeIndex();
    const result = provideCompletion({ line: 0, character: 22 }, '// @awa-component: ', index);
    const ids = result.map((item) => item.label);
    expect(ids).toContain('DIFF-DiffEngine');
    expect(ids).not.toContain('DIFF-1_AC-1');
    expect(ids).not.toContain('DIFF_P-1');
  });

  it('completion items have Reference kind', () => {
    const index = makeIndex();
    const result = provideCompletion({ line: 0, character: 20 }, '// @awa-impl: ', index);
    for (const item of result) {
      // CompletionItemKind.Reference = 18
      expect(item.kind).toBe(18);
    }
  });

  it('completion items include detail with feature code and text', () => {
    const index = makeIndex();
    const result = provideCompletion({ line: 0, character: 20 }, '// @awa-impl: ', index);
    const diff1 = result.find((item) => item.label === 'DIFF-1_AC-1');
    expect(diff1?.detail).toContain('[DIFF]');
    expect(diff1?.detail).toContain('Output must be valid unified diff format');
  });

  it('completion items include impl count in documentation', () => {
    const index = makeIndex();
    const result = provideCompletion({ line: 0, character: 20 }, '// @awa-impl: ', index);
    const diff1 = result.find((item) => item.label === 'DIFF-1_AC-1');
    const doc = diff1?.documentation as { value: string } | undefined;
    expect(doc?.value).toContain('1 impl');
  });

  it('completion items are sorted (sortText is set)', () => {
    const index = makeIndex();
    const result = provideCompletion({ line: 0, character: 20 }, '// @awa-impl: ', index);
    // All items should have a sortText field set
    for (const item of result) {
      expect(item.sortText).toBeDefined();
    }
  });

  it('returns empty array when index has no IDs of matching type', () => {
    const index = makeIndex();
    // Clear all IDs
    index.ids.clear();
    const result = provideCompletion({ line: 0, character: 15 }, '// @awa-impl: ', index);
    expect(result).toHaveLength(0);
  });
});
