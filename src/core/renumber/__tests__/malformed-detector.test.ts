// @awa-test: RENUM-12_AC-1, RENUM-12_AC-2, RENUM-12_AC-3

import { describe, expect, it } from 'vitest';

import { detectMalformed } from '../malformed-detector.js';

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
