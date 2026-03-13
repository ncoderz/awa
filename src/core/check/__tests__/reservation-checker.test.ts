// @awa-component: DEP-ReservationChecker
// @awa-test: DEP-4_AC-1
// @awa-test: DEP-4_AC-2
// @awa-test: DEP_P-3

import { describe, expect, test } from 'vitest';

import { checkReservations } from '../reservation-checker.js';
import type { SpecParseResult } from '../types.js';

function makeSpecs(overrides: Partial<SpecParseResult> = {}): SpecParseResult {
  return {
    requirementIds: new Set(),
    acIds: new Set(),
    propertyIds: new Set(),
    componentNames: new Set(),
    allIds: new Set(),
    specFiles: [],
    idLocations: new Map(),
    ...overrides,
  };
}

describe('checkReservations', () => {
  // @awa-test: DEP_P-3
  test('reports conflict for requirement, AC, property, and component IDs', () => {
    const specs = makeSpecs({
      allIds: new Set(['FOO-1', 'FOO-1_AC-1', 'FOO_P-1', 'FOO-MyComp']),
      idLocations: new Map([
        ['FOO-1', { filePath: 'REQ-FOO.md', line: 10 }],
        ['FOO-1_AC-1', { filePath: 'REQ-FOO.md', line: 12 }],
        ['FOO_P-1', { filePath: 'DESIGN-FOO.md', line: 20 }],
        ['FOO-MyComp', { filePath: 'DESIGN-FOO.md', line: 5 }],
      ]),
    });
    const deprecated = new Set(['FOO-1', 'FOO-1_AC-1', 'FOO_P-1', 'FOO-MyComp']);

    const result = checkReservations(specs, deprecated);

    expect(result.findings).toHaveLength(4);
    for (const f of result.findings) {
      expect(f.severity).toBe('error');
      expect(f.code).toBe('deprecated-id-conflict');
      expect(f.message).toContain('reserved by the deprecated file');
    }
  });

  // @awa-test: DEP-4_AC-1
  test('no findings when no overlap between active and deprecated sets', () => {
    const specs = makeSpecs({
      allIds: new Set(['BAR-1', 'BAR-1_AC-1']),
    });
    const deprecated = new Set(['FOO-1', 'FOO-1_AC-1']);

    const result = checkReservations(specs, deprecated);

    expect(result.findings).toHaveLength(0);
  });

  // @awa-test: DEP-4_AC-2
  test('error message identifies the conflicting ID', () => {
    const specs = makeSpecs({
      allIds: new Set(['FOO-1']),
      idLocations: new Map([['FOO-1', { filePath: 'REQ-FOO.md', line: 5 }]]),
    });
    const deprecated = new Set(['FOO-1']);

    const result = checkReservations(specs, deprecated);

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]!.id).toBe('FOO-1');
    expect(result.findings[0]!.filePath).toBe('REQ-FOO.md');
    expect(result.findings[0]!.line).toBe(5);
  });
});
