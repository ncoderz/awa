// @awa-test: RENUM-7_AC-1, RENUM-11_AC-1

import { describe, expect, it } from 'vitest';

import { formatJson, formatText } from '../reporter.js';
import type { RenumberResult } from '../types.js';

// --- Helpers ---

function makeResult(overrides?: Partial<RenumberResult>): RenumberResult {
  return {
    code: 'FOO',
    map: { code: 'FOO', entries: new Map() },
    affectedFiles: [],
    totalReplacements: 0,
    malformedWarnings: [],
    malformedCorrections: [],
    noChange: true,
    ...overrides,
  };
}

describe('formatText', () => {
  // @awa-test: RENUM-7_AC-1
  it('shows no-change message when noChange is true', () => {
    const result = makeResult({ noChange: true });
    const text = formatText(result, false);
    expect(text).toContain('no changes needed');
  });

  it('shows dry-run banner when dryRun is true', () => {
    const result = makeResult({ noChange: true });
    const text = formatText(result, true);
    expect(text).toContain('DRY RUN');
  });

  it('shows renumber map and affected files', () => {
    const result = makeResult({
      noChange: false,
      map: {
        code: 'FOO',
        entries: new Map([['FOO-3', 'FOO-1']]),
      },
      affectedFiles: [
        {
          filePath: 'REQ-FOO-feature.md',
          replacements: [{ line: 1, oldId: 'FOO-3', newId: 'FOO-1' }],
        },
      ],
      totalReplacements: 1,
    });
    const text = formatText(result, false);
    expect(text).toContain('FOO-3 → FOO-1');
    expect(text).toContain('1 replacement(s) in 1 file(s)');
    expect(text).toContain('REQ-FOO-feature.md');
  });

  it('shows malformed warnings', () => {
    const result = makeResult({
      noChange: false,
      map: {
        code: 'FOO',
        entries: new Map([['FOO-3', 'FOO-1']]),
      },
      malformedWarnings: [{ filePath: 'test.ts', line: 5, token: 'FOO-abc' }],
    });
    const text = formatText(result, false);
    expect(text).toContain('Malformed ID warnings');
    expect(text).toContain('FOO-abc');
  });
});

describe('formatJson', () => {
  // @awa-test: RENUM-11_AC-1
  it('outputs valid JSON with map and affected files', () => {
    const result = makeResult({
      noChange: false,
      map: {
        code: 'FOO',
        entries: new Map([['FOO-3', 'FOO-1']]),
      },
      affectedFiles: [
        {
          filePath: 'REQ-FOO-feature.md',
          replacements: [{ line: 1, oldId: 'FOO-3', newId: 'FOO-1' }],
        },
      ],
      totalReplacements: 1,
    });
    const json = formatJson(result);
    const parsed = JSON.parse(json);

    expect(parsed.code).toBe('FOO');
    expect(parsed.noChange).toBe(false);
    expect(parsed.map['FOO-3']).toBe('FOO-1');
    expect(parsed.affectedFiles).toHaveLength(1);
    expect(parsed.totalReplacements).toBe(1);
  });

  it('outputs valid JSON for no-change results', () => {
    const result = makeResult({ noChange: true });
    const json = formatJson(result);
    const parsed = JSON.parse(json);

    expect(parsed.code).toBe('FOO');
    expect(parsed.noChange).toBe(true);
    expect(parsed.map).toEqual({});
  });

  it('includes malformed warnings in JSON', () => {
    const result = makeResult({
      noChange: false,
      map: { code: 'FOO', entries: new Map([['FOO-3', 'FOO-1']]) },
      malformedWarnings: [{ filePath: 'test.ts', line: 5, token: 'FOO-abc' }],
    });
    const json = formatJson(result);
    const parsed = JSON.parse(json);

    expect(parsed.malformedWarnings).toHaveLength(1);
    expect(parsed.malformedWarnings[0].token).toBe('FOO-abc');
  });
});
