import { describe, expect, it } from 'vitest';

import { formatJson, formatText } from '../reporter.js';
import type { MergeResult } from '../types.js';

// --- Helpers ---

function makeResult(overrides: Partial<MergeResult> = {}): MergeResult {
  return {
    sourceCode: 'SRC',
    targetCode: 'TGT',
    map: { code: 'SRC', entries: new Map([['SRC-1', 'TGT-3']]) },
    affectedFiles: [
      { filePath: 'file.ts', replacements: [{ line: 1, oldId: 'SRC-1', newId: 'TGT-3' }] },
    ],
    totalReplacements: 1,
    moves: [
      {
        sourceFile: '.awa/specs/REQ-SRC-feat.md',
        targetFile: '.awa/specs/REQ-TGT-feat.md',
        docType: 'REQ',
      },
    ],
    staleRefs: [],
    noChange: false,
    ...overrides,
  };
}

describe('formatText', () => {
  it('shows dry-run banner when dryRun is true', () => {
    const text = formatText(makeResult(), true);
    expect(text).toContain('DRY RUN');
  });

  it('shows no-change message when noChange is true', () => {
    const text = formatText(makeResult({ noChange: true }), false);
    expect(text).toContain('nothing to merge');
  });

  it('shows ID remap table', () => {
    const text = formatText(makeResult(), false);
    expect(text).toContain('SRC-1 → TGT-3');
    expect(text).toContain('1 ID(s) recoded');
  });

  it('shows file moves', () => {
    const result = makeResult({
      moves: [
        {
          sourceFile: '.awa/specs/REQ-SRC-feat.md',
          targetFile: '.awa/specs/REQ-TGT-feat.md',
          docType: 'REQ',
        },
        {
          sourceFile: '.awa/specs/DESIGN-SRC-feat.md',
          targetFile: '.awa/specs/DESIGN-TGT-feat.md',
          docType: 'DESIGN',
        },
      ],
    });
    const text = formatText(result, false);
    expect(text).toContain('2 file(s) moved');
    expect(text).toContain('REQ-SRC-feat.md → .awa/specs/REQ-TGT-feat.md (REQ)');
    expect(text).toContain('DESIGN-SRC-feat.md → .awa/specs/DESIGN-TGT-feat.md (DESIGN)');
  });

  it('shows affected files', () => {
    const text = formatText(makeResult(), false);
    expect(text).toContain('1 replacement(s) in 1 file(s)');
    expect(text).toContain('file.ts (1)');
  });

  it('shows stale references as errors', () => {
    const text = formatText(makeResult({ staleRefs: ['.awa/specs/REQ-OTHER.md'] }), false);
    expect(text).toContain('still reference SRC');
    expect(text).toContain('REQ-OTHER.md');
  });
});

describe('formatJson', () => {
  it('produces valid JSON', () => {
    const json = formatJson(makeResult());
    const parsed = JSON.parse(json);
    expect(parsed.sourceCode).toBe('SRC');
    expect(parsed.targetCode).toBe('TGT');
  });

  it('includes map entries as object', () => {
    const json = formatJson(makeResult());
    const parsed = JSON.parse(json);
    expect(parsed.map['SRC-1']).toBe('TGT-3');
  });

  it('includes moves with docType', () => {
    const json = formatJson(makeResult());
    const parsed = JSON.parse(json);
    expect(parsed.moves).toHaveLength(1);
    expect(parsed.moves[0].sourceFile).toBe('.awa/specs/REQ-SRC-feat.md');
  });

  it('includes staleRefs', () => {
    const json = formatJson(makeResult({ staleRefs: ['ref.md'] }));
    const parsed = JSON.parse(json);
    expect(parsed.staleRefs).toEqual(['ref.md']);
  });

  it('includes noChange flag', () => {
    const json = formatJson(makeResult({ noChange: true }));
    const parsed = JSON.parse(json);
    expect(parsed.noChange).toBe(true);
  });
});
