// @awa-test: RCOD-4_AC-2, RCOD-4_AC-3

import { describe, expect, it } from 'vitest';
import { formatJson, formatText } from '../reporter.js';
import type { RecodeResult } from '../types.js';

// --- Helpers ---

function makeResult(overrides: Partial<RecodeResult> = {}): RecodeResult {
  return {
    sourceCode: 'SRC',
    targetCode: 'TGT',
    map: { code: 'SRC', entries: new Map([['SRC-1', 'TGT-3']]) },
    affectedFiles: [
      {
        filePath: 'file.ts',
        replacements: [{ line: 5, oldId: 'SRC-1', newId: 'TGT-3' }],
      },
    ],
    totalReplacements: 1,
    renames: [],
    staleRefs: [],
    noChange: false,
    ...overrides,
  };
}

describe('formatText', () => {
  // @awa-test: RCOD-4_AC-2
  it('formats recode results as text', () => {
    const result = makeResult();
    const text = formatText(result, false);

    expect(text).toContain('SRC → TGT');
    expect(text).toContain('1 ID(s) recoded');
    expect(text).toContain('SRC-1 → TGT-3');
    expect(text).toContain('file.ts (1)');
  });

  it('includes dry run banner', () => {
    const result = makeResult();
    const text = formatText(result, true);

    expect(text).toContain('DRY RUN');
  });

  it('shows no-change message', () => {
    const result = makeResult({
      map: { code: 'SRC', entries: new Map() },
      affectedFiles: [],
      totalReplacements: 0,
      noChange: true,
    });
    const text = formatText(result, false);

    expect(text).toContain('no IDs to recode');
  });
});

describe('formatJson', () => {
  // @awa-test: RCOD-4_AC-3
  it('formats recode results as valid JSON', () => {
    const result = makeResult();
    const json = formatJson(result);
    const parsed = JSON.parse(json);

    expect(parsed.sourceCode).toBe('SRC');
    expect(parsed.targetCode).toBe('TGT');
    expect(parsed.map['SRC-1']).toBe('TGT-3');
    expect(parsed.affectedFiles).toHaveLength(1);
    expect(parsed.totalReplacements).toBe(1);
  });

  it('includes noChange flag', () => {
    const result = makeResult({ noChange: true });
    const json = formatJson(result);
    const parsed = JSON.parse(json);

    expect(parsed.noChange).toBe(true);
  });
});
