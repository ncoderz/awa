import { describe, expect, test } from 'vitest';

import { checkDuplicateIds } from '../duplicate-checker.js';
import type { SpecParseResult } from '../types.js';

function makeSpecs(
  allIdLocations: Map<string, Array<{ filePath: string; line: number }>>,
  overrides: Partial<SpecParseResult> = {},
): SpecParseResult {
  return {
    requirementIds: new Set(),
    acIds: new Set(),
    propertyIds: new Set(),
    componentNames: new Set(),
    allIds: new Set(),
    specFiles: [],
    idLocations: new Map(),
    allIdLocations,
    parserFindings: [],
    ...overrides,
  };
}

describe('checkDuplicateIds', () => {
  test('reports duplicate requirement ID within a single file', () => {
    const locs = new Map([
      [
        'FOO-1',
        [
          { filePath: 'specs/REQ-FOO-feature.md', line: 10 },
          { filePath: 'specs/REQ-FOO-feature.md', line: 25 },
        ],
      ],
    ]);
    const result = checkDuplicateIds(makeSpecs(locs));

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: 'error',
      code: 'duplicate-spec-id',
      id: 'FOO-1',
      filePath: 'specs/REQ-FOO-feature.md',
      line: 25,
    });
    expect(result.findings[0]!.message).toContain("Spec ID 'FOO-1' is defined multiple times");
  });

  test('reports duplicate AC ID across files', () => {
    const locs = new Map([
      [
        'FOO-1_AC-1',
        [
          { filePath: 'specs/REQ-FOO-a.md', line: 5 },
          { filePath: 'specs/REQ-FOO-b.md', line: 12 },
        ],
      ],
    ]);
    const result = checkDuplicateIds(makeSpecs(locs));

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: 'error',
      code: 'duplicate-spec-id',
      id: 'FOO-1_AC-1',
      filePath: 'specs/REQ-FOO-b.md',
      line: 12,
    });
  });

  test('reports duplicate component name across DESIGN files', () => {
    const locs = new Map([
      [
        'CLI-Parser',
        [
          { filePath: 'specs/DESIGN-CLI-cli.md', line: 20 },
          { filePath: 'specs/DESIGN-CLI-check.md', line: 15 },
        ],
      ],
    ]);
    const result = checkDuplicateIds(makeSpecs(locs));

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: 'error',
      code: 'duplicate-spec-id',
      id: 'CLI-Parser',
    });
  });

  test('reports duplicate property ID', () => {
    const locs = new Map([
      [
        'FOO_P-1',
        [
          { filePath: 'specs/DESIGN-FOO-a.md', line: 30 },
          { filePath: 'specs/DESIGN-FOO-b.md', line: 40 },
        ],
      ],
    ]);
    const result = checkDuplicateIds(makeSpecs(locs));

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: 'error',
      code: 'duplicate-spec-id',
      id: 'FOO_P-1',
    });
  });

  test('does not report unique IDs', () => {
    const locs = new Map([
      ['FOO-1', [{ filePath: 'specs/REQ-FOO.md', line: 10 }]],
      ['FOO-1_AC-1', [{ filePath: 'specs/REQ-FOO.md', line: 12 }]],
      ['FOO_P-1', [{ filePath: 'specs/DESIGN-FOO.md', line: 20 }]],
    ]);
    const result = checkDuplicateIds(makeSpecs(locs));

    expect(result.findings).toHaveLength(0);
  });

  test('reports multiple findings for triple occurrence', () => {
    const locs = new Map([
      [
        'BAR-1',
        [
          { filePath: 'specs/REQ-BAR-a.md', line: 5 },
          { filePath: 'specs/REQ-BAR-b.md', line: 10 },
          { filePath: 'specs/REQ-BAR-c.md', line: 15 },
        ],
      ],
    ]);
    const result = checkDuplicateIds(makeSpecs(locs));

    // One finding per extra occurrence (2 findings for 3 occurrences)
    expect(result.findings).toHaveLength(2);
    expect(result.findings[0]!.filePath).toBe('specs/REQ-BAR-b.md');
    expect(result.findings[1]!.filePath).toBe('specs/REQ-BAR-c.md');
  });

  test('empty allIdLocations produces no findings', () => {
    const result = checkDuplicateIds(makeSpecs(new Map()));
    expect(result.findings).toHaveLength(0);
  });
});
