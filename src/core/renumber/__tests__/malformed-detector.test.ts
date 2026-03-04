// @awa-test: RENUM-12_AC-1, RENUM-12_AC-2, RENUM-12_AC-3

import { describe, expect, it } from 'vitest';

import { correctMalformed, detectMalformed, expandMalformedToken } from '../malformed-detector.js';

describe('detectMalformed', () => {
  // @awa-test: RENUM-12_AC-1
  it('detects tokens matching prefix but not standard ID format', () => {
    const files = new Map([['test.ts', `// @awa-${'impl'}: FOO-1abc\n// valid: FOO-1_AC-1\n`]]);

    const warnings = detectMalformed('FOO', files);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.token).toBe('FOO-1abc');
  });

  // @awa-test: RENUM-12_AC-2
  it('reports file path, line number, and invalid token', () => {
    const files = new Map([['src/foo.ts', 'line one\n// FOO-1x2 bad token\nline three\n']]);

    const warnings = detectMalformed('FOO', files);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toEqual({
      filePath: 'src/foo.ts',
      line: 2,
      token: 'FOO-1x2',
    });
  });

  // @awa-test: RENUM-12_AC-3
  it('does not flag valid IDs', () => {
    const files = new Map([
      [
        'test.md',
        [
          '### FOO-1: Title',
          '- FOO-1_AC-1 [event]: desc',
          '- FOO_P-1 [Name]: desc',
          '### FOO-Parser',
          '### FOO-1.2: Subreq',
          '- FOO-1.2_AC-3 [cond]: desc',
        ].join('\n'),
      ],
    ]);

    const warnings = detectMalformed('FOO', files);

    expect(warnings).toHaveLength(0);
  });

  it('detects multiple malformed tokens across files', () => {
    const files = new Map([
      ['a.ts', '// FOO-1bad\n'],
      ['b.ts', '// FOO-2bad\n// FOO-1_AC-1 valid\n// FOO_P-blah\n'],
    ]);

    const warnings = detectMalformed('FOO', files);

    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(warnings.map((w) => w.token)).toContain('FOO-1bad');
    expect(warnings.map((w) => w.token)).toContain('FOO-2bad');
  });

  it('ignores natural language tokens starting with lowercase after prefix', () => {
    const files = new Map([
      ['doc.md', 'CLI-provided values\nCLI-only mode\nCLI-over-file approach\nCLI-- separator\n'],
    ]);

    const warnings = detectMalformed('CLI', files);

    expect(warnings).toHaveLength(0);
  });

  it('ignores tokens from other feature codes', () => {
    const files = new Map([['test.ts', '// BAR-bad1\n// FOO-1 valid\n']]);

    const warnings = detectMalformed('FOO', files);

    expect(warnings).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    const warnings = detectMalformed('FOO', new Map());
    expect(warnings).toHaveLength(0);
  });
});

describe('expandMalformedToken', () => {
  it('expands slash range on ACs into two IDs', () => {
    const result = expandMalformedToken('ARC-36_AC-8/9');
    expect(result).toBe('ARC-36_AC-8, ARC-36_AC-9');
  });

  it('expands slash range on subrequirement ACs', () => {
    const result = expandMalformedToken('ARC-1.2_AC-3/4');
    expect(result).toBe('ARC-1.2_AC-3, ARC-1.2_AC-4');
  });

  it('expands dot-dot range on ACs into sequential IDs', () => {
    const result = expandMalformedToken('ARC-18_AC-14..16');
    expect(result).toBe('ARC-18_AC-14, ARC-18_AC-15, ARC-18_AC-16');
  });

  it('expands dot-dot range on subrequirement ACs', () => {
    const result = expandMalformedToken('FOO-5.1_AC-2..4');
    expect(result).toBe('FOO-5.1_AC-2, FOO-5.1_AC-3, FOO-5.1_AC-4');
  });

  it('returns undefined for trailing period (ambiguous — likely end of sentence)', () => {
    expect(expandMalformedToken('ARC_P-206.')).toBeUndefined();
  });

  it('returns undefined for trailing period on AC', () => {
    expect(expandMalformedToken('ARC-25.3_AC-7.')).toBeUndefined();
  });

  it('returns undefined for letter suffix (ambiguous)', () => {
    expect(expandMalformedToken('ARC-18_AC-7a')).toBeUndefined();
  });

  it('returns undefined for full-ID range (ambiguous)', () => {
    expect(expandMalformedToken('ARC-20..ARC-25')).toBeUndefined();
  });

  it('returns undefined for component + period (ambiguous)', () => {
    expect(expandMalformedToken('ARC-ChunkedTransferManager.')).toBeUndefined();
  });

  it('returns undefined for invalid dot-dot range (end <= start)', () => {
    expect(expandMalformedToken('FOO-1_AC-5..3')).toBeUndefined();
  });

  it('returns undefined for invalid dot-dot range (end == start)', () => {
    expect(expandMalformedToken('FOO-1_AC-5..5')).toBeUndefined();
  });
});

describe('correctMalformed', () => {
  it('corrects slash range in file content', async () => {
    const fileContents = new Map([['test.md', 'See ARC-36_AC-8/9 for details\n']]);
    const warnings = detectMalformed('ARC', fileContents);

    const { corrections, remainingWarnings } = await correctMalformed(
      'ARC',
      warnings,
      fileContents,
      true, // dry-run
    );

    expect(corrections).toHaveLength(1);
    expect(corrections[0]?.token).toBe('ARC-36_AC-8/9');
    expect(corrections[0]?.replacement).toBe('ARC-36_AC-8, ARC-36_AC-9');
    expect(remainingWarnings).toHaveLength(0);
  });

  it('corrects dot-dot AC range in file content', async () => {
    const fileContents = new Map([['test.md', 'Covers ARC-18_AC-14..16 criteria\n']]);
    const warnings = detectMalformed('ARC', fileContents);

    const { corrections, remainingWarnings } = await correctMalformed(
      'ARC',
      warnings,
      fileContents,
      true,
    );

    expect(corrections).toHaveLength(1);
    expect(corrections[0]?.token).toBe('ARC-18_AC-14..16');
    expect(corrections[0]?.replacement).toBe('ARC-18_AC-14, ARC-18_AC-15, ARC-18_AC-16');
    expect(remainingWarnings).toHaveLength(0);
  });

  it('leaves trailing period as warning (not corrected)', async () => {
    const fileContents = new Map([['test.md', 'See ARC_P-206.\n']]);
    const warnings = detectMalformed('ARC', fileContents);

    const { corrections, remainingWarnings } = await correctMalformed(
      'ARC',
      warnings,
      fileContents,
      true,
    );

    expect(corrections).toHaveLength(0);
    expect(remainingWarnings).toHaveLength(1);
    expect(remainingWarnings[0]?.token).toBe('ARC_P-206.');
  });

  it('leaves ambiguous patterns as warnings', async () => {
    const fileContents = new Map([['test.md', 'See ARC-18_AC-7a and ARC-20..ARC-25 here\n']]);
    const warnings = detectMalformed('ARC', fileContents);

    const { corrections, remainingWarnings } = await correctMalformed(
      'ARC',
      warnings,
      fileContents,
      true,
    );

    expect(corrections).toHaveLength(0);
    expect(remainingWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it('handles mix of correctable and ambiguous tokens', async () => {
    const fileContents = new Map([
      ['test.md', 'ARC-36_AC-8/9 and ARC_P-206. and ARC-18_AC-14..16\n'],
    ]);
    const warnings = detectMalformed('ARC', fileContents);

    const { corrections, remainingWarnings } = await correctMalformed(
      'ARC',
      warnings,
      fileContents,
      true,
    );

    // Two correctable (slash range + dot-dot range), one warning (trailing period)
    expect(corrections).toHaveLength(2);
    expect(remainingWarnings).toHaveLength(1);
    expect(corrections.map((c) => c.token)).toContain('ARC-36_AC-8/9');
    expect(corrections.map((c) => c.token)).toContain('ARC-18_AC-14..16');
    expect(remainingWarnings[0]?.token).toBe('ARC_P-206.');
  });

  it('returns empty corrections when no warnings', async () => {
    const { corrections, remainingWarnings } = await correctMalformed('FOO', [], new Map(), true);

    expect(corrections).toHaveLength(0);
    expect(remainingWarnings).toHaveLength(0);
  });
});
