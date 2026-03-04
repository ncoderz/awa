// @awa-test: RENUM-1_AC-1
// @awa-test: RCOD-1_AC-1

import { describe, expect, it } from 'vitest';

import type { SpecFile } from '../check/types.js';
import { findSpecFile, findSpecFiles, hasAnySpecFile, SPEC_PREFIXES } from '../spec-file-utils.js';

function makeSpecFile(overrides: Partial<SpecFile> & { filePath: string }): SpecFile {
  return {
    code: '',
    requirementIds: [],
    acIds: [],
    propertyIds: [],
    componentNames: [],
    crossRefs: [],
    ...overrides,
  };
}

describe('findSpecFiles', () => {
  it('returns all matching files for a code and prefix', () => {
    const files = [
      makeSpecFile({ filePath: '.awa/specs/REQ-ARC-capability-model.md', code: 'ARC' }),
      makeSpecFile({ filePath: '.awa/specs/REQ-ARC-flows.md', code: 'ARC' }),
      makeSpecFile({ filePath: '.awa/specs/REQ-ARC-transfer.md', code: 'ARC' }),
      makeSpecFile({ filePath: '.awa/specs/DESIGN-ARC-transfer.md', code: 'ARC' }),
      makeSpecFile({ filePath: '.awa/specs/REQ-OTHER-feature.md', code: 'OTHER' }),
    ];

    const result = findSpecFiles(files, 'ARC', 'REQ');

    expect(result).toHaveLength(3);
    expect(result.map((f) => f.filePath)).toEqual([
      '.awa/specs/REQ-ARC-capability-model.md',
      '.awa/specs/REQ-ARC-flows.md',
      '.awa/specs/REQ-ARC-transfer.md',
    ]);
  });

  it('returns files sorted alphabetically by basename', () => {
    const files = [
      makeSpecFile({ filePath: '.awa/specs/DESIGN-FOO-zebra.md', code: 'FOO' }),
      makeSpecFile({ filePath: '.awa/specs/DESIGN-FOO-alpha.md', code: 'FOO' }),
      makeSpecFile({ filePath: '.awa/specs/DESIGN-FOO-middle.md', code: 'FOO' }),
    ];

    const result = findSpecFiles(files, 'FOO', 'DESIGN');

    expect(result.map((f) => f.filePath)).toEqual([
      '.awa/specs/DESIGN-FOO-alpha.md',
      '.awa/specs/DESIGN-FOO-middle.md',
      '.awa/specs/DESIGN-FOO-zebra.md',
    ]);
  });

  it('returns empty array when no files match', () => {
    const files = [makeSpecFile({ filePath: '.awa/specs/REQ-OTHER-feature.md', code: 'OTHER' })];

    const result = findSpecFiles(files, 'NOPE', 'REQ');

    expect(result).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(findSpecFiles([], 'FOO', 'REQ')).toEqual([]);
  });

  it('does not match partial code prefixes', () => {
    const files = [
      makeSpecFile({ filePath: '.awa/specs/REQ-ARC-feature.md', code: 'ARC' }),
      makeSpecFile({ filePath: '.awa/specs/REQ-ARCH-feature.md', code: 'ARCH' }),
    ];

    const result = findSpecFiles(files, 'ARC', 'REQ');

    expect(result).toHaveLength(1);
    expect(result[0]!.filePath).toBe('.awa/specs/REQ-ARC-feature.md');
  });
});

describe('findSpecFile', () => {
  it('returns the first alphabetically matching file', () => {
    const files = [
      makeSpecFile({ filePath: '.awa/specs/REQ-FOO-zebra.md', code: 'FOO' }),
      makeSpecFile({ filePath: '.awa/specs/REQ-FOO-alpha.md', code: 'FOO' }),
    ];

    const result = findSpecFile(files, 'FOO', 'REQ');

    expect(result?.filePath).toBe('.awa/specs/REQ-FOO-alpha.md');
  });

  it('returns undefined when no files match', () => {
    expect(findSpecFile([], 'FOO', 'REQ')).toBeUndefined();
  });
});

describe('hasAnySpecFile', () => {
  it('returns true when a matching spec file exists', () => {
    const files = [makeSpecFile({ filePath: '.awa/specs/FEAT-ARC-feature.md', code: 'ARC' })];

    expect(hasAnySpecFile(files, 'ARC')).toBe(true);
  });

  it('checks across all known prefixes', () => {
    for (const prefix of SPEC_PREFIXES) {
      const files = [
        makeSpecFile({ filePath: `.awa/specs/${prefix}-TEST-feature.md`, code: 'TEST' }),
      ];
      expect(hasAnySpecFile(files, 'TEST')).toBe(true);
    }
  });

  it('returns false when no matching spec file exists', () => {
    const files = [makeSpecFile({ filePath: '.awa/specs/REQ-OTHER-feature.md', code: 'OTHER' })];

    expect(hasAnySpecFile(files, 'NOPE')).toBe(false);
  });

  it('returns false for empty input', () => {
    expect(hasAnySpecFile([], 'FOO')).toBe(false);
  });
});
