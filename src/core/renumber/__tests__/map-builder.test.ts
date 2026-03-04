// @awa-test: RENUM_P-1, RENUM_P-2, RENUM_P-3
// @awa-test: RENUM-1_AC-1, RENUM-1_AC-2, RENUM-1_AC-3
// @awa-test: RENUM-2_AC-1, RENUM-2_AC-2
// @awa-test: RENUM-3_AC-1, RENUM-3_AC-2
// @awa-test: RENUM-4_AC-1, RENUM-4_AC-2

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { SpecFile, SpecParseResult } from '../../check/types.js';
import { buildRenumberMap } from '../map-builder.js';
import { RenumberError } from '../types.js';

// --- Helpers ---

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

function makeSpecs(specFiles: SpecFile[]): SpecParseResult {
  const requirementIds = new Set<string>();
  const acIds = new Set<string>();
  const propertyIds = new Set<string>();
  const componentNames = new Set<string>();
  const idLocations = new Map<string, { filePath: string; line: number }>();

  for (const sf of specFiles) {
    for (const id of sf.requirementIds) requirementIds.add(id);
    for (const id of sf.acIds) acIds.add(id);
    for (const id of sf.propertyIds) propertyIds.add(id);
    for (const name of sf.componentNames) componentNames.add(name);
  }

  const allIds = new Set([...requirementIds, ...acIds, ...propertyIds, ...componentNames]);
  return { requirementIds, acIds, propertyIds, componentNames, allIds, specFiles, idLocations };
}

// --- Unit Tests ---

describe('buildRenumberMap', () => {
  // @awa-test: RENUM-1_AC-1
  it('assigns sequential requirement numbers starting from 1', () => {
    const reqFile = makeSpecFile({
      filePath: '.awa/specs/REQ-FOO-feature.md',
      code: 'FOO',
      requirementIds: ['FOO-3', 'FOO-5', 'FOO-10'],
      acIds: [],
    });
    const specs = makeSpecs([reqFile]);

    const { map, noChange } = buildRenumberMap('FOO', specs);

    expect(noChange).toBe(false);
    expect(map.entries.get('FOO-3')).toBe('FOO-1');
    expect(map.entries.get('FOO-5')).toBe('FOO-2');
    expect(map.entries.get('FOO-10')).toBe('FOO-3');
  });

  // @awa-test: RENUM-1_AC-2, RENUM-2_AC-1, RENUM-2_AC-2
  it('includes subrequirements with updated parent prefix', () => {
    const reqFile = makeSpecFile({
      filePath: '.awa/specs/REQ-FOO-feature.md',
      code: 'FOO',
      requirementIds: ['FOO-3', 'FOO-3.2', 'FOO-3.5'],
      acIds: [],
    });
    const specs = makeSpecs([reqFile]);

    const { map } = buildRenumberMap('FOO', specs);

    expect(map.entries.get('FOO-3')).toBe('FOO-1');
    expect(map.entries.get('FOO-3.2')).toBe('FOO-1.1');
    expect(map.entries.get('FOO-3.5')).toBe('FOO-1.2');
  });

  // @awa-test: RENUM-3_AC-1, RENUM-3_AC-2
  it('renumbers ACs sequentially within their parent', () => {
    const reqFile = makeSpecFile({
      filePath: '.awa/specs/REQ-FOO-feature.md',
      code: 'FOO',
      requirementIds: ['FOO-5'],
      acIds: ['FOO-5_AC-3', 'FOO-5_AC-7'],
    });
    const specs = makeSpecs([reqFile]);

    const { map } = buildRenumberMap('FOO', specs);

    // FOO-5 → FOO-1, so ACs update parent prefix too
    expect(map.entries.get('FOO-5_AC-3')).toBe('FOO-1_AC-1');
    expect(map.entries.get('FOO-5_AC-7')).toBe('FOO-1_AC-2');
  });

  it('renumbers ACs on subrequirements with updated parent', () => {
    const reqFile = makeSpecFile({
      filePath: '.awa/specs/REQ-FOO-feature.md',
      code: 'FOO',
      requirementIds: ['FOO-3', 'FOO-3.5'],
      acIds: ['FOO-3.5_AC-2', 'FOO-3.5_AC-4'],
    });
    const specs = makeSpecs([reqFile]);

    const { map } = buildRenumberMap('FOO', specs);

    // FOO-3 → FOO-1, FOO-3.5 → FOO-1.1
    expect(map.entries.get('FOO-3.5_AC-2')).toBe('FOO-1.1_AC-1');
    expect(map.entries.get('FOO-3.5_AC-4')).toBe('FOO-1.1_AC-2');
  });

  // @awa-test: RENUM-1_AC-3
  it('returns noChange=true when IDs are already sequential', () => {
    const reqFile = makeSpecFile({
      filePath: '.awa/specs/REQ-FOO-feature.md',
      code: 'FOO',
      requirementIds: ['FOO-1', 'FOO-2', 'FOO-3'],
      acIds: ['FOO-1_AC-1', 'FOO-2_AC-1', 'FOO-3_AC-1'],
    });
    const specs = makeSpecs([reqFile]);

    const { map, noChange } = buildRenumberMap('FOO', specs);

    expect(noChange).toBe(true);
    expect(map.entries.size).toBe(0);
  });

  // @awa-test: RENUM-4_AC-1
  it('renumbers properties from DESIGN file', () => {
    const reqFile = makeSpecFile({
      filePath: '.awa/specs/REQ-FOO-feature.md',
      code: 'FOO',
      requirementIds: ['FOO-1'],
      acIds: [],
    });
    const designFile = makeSpecFile({
      filePath: '.awa/specs/DESIGN-FOO-feature.md',
      code: 'FOO',
      propertyIds: ['FOO_P-3', 'FOO_P-7'],
    });
    const specs = makeSpecs([reqFile, designFile]);

    const { map } = buildRenumberMap('FOO', specs);

    expect(map.entries.get('FOO_P-3')).toBe('FOO_P-1');
    expect(map.entries.get('FOO_P-7')).toBe('FOO_P-2');
  });

  // @awa-test: RENUM-4_AC-2
  it('skips property renumbering when no DESIGN file exists', () => {
    const reqFile = makeSpecFile({
      filePath: '.awa/specs/REQ-FOO-feature.md',
      code: 'FOO',
      requirementIds: ['FOO-1'],
      acIds: ['FOO-1_AC-1'],
    });
    const specs = makeSpecs([reqFile]);

    const { map, noChange } = buildRenumberMap('FOO', specs);

    // No changes since already sequential and no properties
    expect(noChange).toBe(true);
    expect(map.entries.size).toBe(0);
  });

  it('throws CODE_NOT_FOUND when no REQ file matches', () => {
    const specs = makeSpecs([]);

    expect(() => buildRenumberMap('NOPE', specs)).toThrow(RenumberError);
    expect(() => buildRenumberMap('NOPE', specs)).toThrow('No REQ file found');
  });

  it('handles complex scenario with gaps at all levels', () => {
    const reqFile = makeSpecFile({
      filePath: '.awa/specs/REQ-BAR-feature.md',
      code: 'BAR',
      requirementIds: ['BAR-2', 'BAR-2.3', 'BAR-2.7', 'BAR-5'],
      acIds: ['BAR-2_AC-2', 'BAR-2_AC-5', 'BAR-2.3_AC-1', 'BAR-5_AC-3'],
    });
    const designFile = makeSpecFile({
      filePath: '.awa/specs/DESIGN-BAR-feature.md',
      code: 'BAR',
      propertyIds: ['BAR_P-4'],
    });
    const specs = makeSpecs([reqFile, designFile]);

    const { map, noChange } = buildRenumberMap('BAR', specs);

    expect(noChange).toBe(false);
    // requirements: BAR-2→BAR-1, BAR-5→BAR-2
    expect(map.entries.get('BAR-2')).toBe('BAR-1');
    expect(map.entries.get('BAR-5')).toBe('BAR-2');
    // subrequirements: BAR-2.3→BAR-1.1, BAR-2.7→BAR-1.2
    expect(map.entries.get('BAR-2.3')).toBe('BAR-1.1');
    expect(map.entries.get('BAR-2.7')).toBe('BAR-1.2');
    // ACs on req: BAR-2_AC-2→BAR-1_AC-1, BAR-2_AC-5→BAR-1_AC-2
    expect(map.entries.get('BAR-2_AC-2')).toBe('BAR-1_AC-1');
    expect(map.entries.get('BAR-2_AC-5')).toBe('BAR-1_AC-2');
    // AC on subreq: BAR-2.3_AC-1→BAR-1.1_AC-1
    expect(map.entries.get('BAR-2.3_AC-1')).toBe('BAR-1.1_AC-1');
    // AC on second req: BAR-5_AC-3→BAR-2_AC-1
    expect(map.entries.get('BAR-5_AC-3')).toBe('BAR-2_AC-1');
    // Property: BAR_P-4→BAR_P-1
    expect(map.entries.get('BAR_P-4')).toBe('BAR_P-1');
  });
});

// --- Property-Based Tests ---

describe('Map Builder Properties', () => {
  // Helper: generate a "shuffled" set of requirement IDs for a code
  const codeArb = fc.constantFrom('FOO', 'BAR', 'CHK', 'TRC');

  /**
   * Generate a list of requirements with gaps (non-sequential numbers).
   * Returns { reqIds, subReqIds, acIds } in document order.
   */
  function genReqIds(code: string) {
    return fc
      .record({
        count: fc.integer({ min: 1, max: 20 }),
        startGap: fc.integer({ min: 1, max: 50 }),
      })
      .chain(({ count, startGap }) => {
        // Generate unique, sorted requirement numbers with gaps
        return fc
          .uniqueArray(fc.integer({ min: startGap, max: startGap + count * 10 }), {
            minLength: count,
            maxLength: count,
          })
          .map((nums) => {
            nums.sort((a, b) => a - b);
            return nums.map((n) => `${code}-${n}`);
          });
      });
  }

  // @awa-test: RENUM_P-1
  it('P-1: same REQ content always produces the same renumber map', () => {
    fc.assert(
      fc.property(codeArb, (code) => {
        return fc.assert(
          fc.property(genReqIds(code), (reqIds) => {
            const reqFile = makeSpecFile({
              filePath: `.awa/specs/REQ-${code}-test.md`,
              code,
              requirementIds: reqIds,
              acIds: [],
            });
            const specs = makeSpecs([reqFile]);

            const result1 = buildRenumberMap(code, specs);
            const result2 = buildRenumberMap(code, specs);

            // Maps should be identical
            expect(result1.noChange).toBe(result2.noChange);
            expect([...result1.map.entries]).toEqual([...result2.map.entries]);
          }),
          { numRuns: 50 },
        );
      }),
      { numRuns: 2 },
    );
  });

  // @awa-test: RENUM_P-2
  it('P-2: every subreq and AC of a renumbered req has updated parent prefix in map', () => {
    fc.assert(
      fc.property(
        codeArb.chain((code) =>
          fc.tuple(
            fc.constant(code),
            fc.integer({ min: 2, max: 20 }), // parent number (not 1, to force rename)
            fc.integer({ min: 1, max: 5 }), // subreq count
            fc.integer({ min: 1, max: 5 }), // acs per parent count
          ),
        ),
        ([code, parentNum, subCount, acCount]) => {
          const parentId = `${code}-${parentNum}`;
          const subIds = Array.from({ length: subCount }, (_, i) => `${parentId}.${i + 1}`);
          const acIds = Array.from({ length: acCount }, (_, i) => `${parentId}_AC-${i + 1}`);
          const subAcIds = subIds.flatMap((subId) =>
            Array.from({ length: acCount }, (_, i) => `${subId}_AC-${i + 1}`),
          );

          const reqFile = makeSpecFile({
            filePath: `.awa/specs/REQ-${code}-test.md`,
            code,
            requirementIds: [parentId, ...subIds],
            acIds: [...acIds, ...subAcIds],
          });
          const specs = makeSpecs([reqFile]);

          const { map } = buildRenumberMap(code, specs);
          const newParentId = map.entries.get(parentId) ?? parentId;

          // Every subreq in the map should start with the new parent prefix
          for (const subId of subIds) {
            const newSubId = map.entries.get(subId) ?? subId;
            expect(newSubId.startsWith(`${newParentId}.`)).toBe(true);
          }

          // Every AC should start with the new parent ID
          for (const acId of acIds) {
            const newAcId = map.entries.get(acId) ?? acId;
            expect(newAcId.startsWith(`${newParentId}_AC-`)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // @awa-test: RENUM_P-3
  it('P-3: already-sequential spec produces empty map', () => {
    fc.assert(
      fc.property(codeArb, fc.integer({ min: 1, max: 20 }), (code, count) => {
        // Build sequential IDs: CODE-1, CODE-2, ..., CODE-N
        const reqIds = Array.from({ length: count }, (_, i) => `${code}-${i + 1}`);
        const acIds = reqIds.map((id) => `${id}_AC-1`);
        const propIds = Array.from({ length: count }, (_, i) => `${code}_P-${i + 1}`);

        const reqFile = makeSpecFile({
          filePath: `.awa/specs/REQ-${code}-test.md`,
          code,
          requirementIds: reqIds,
          acIds,
        });
        const designFile = makeSpecFile({
          filePath: `.awa/specs/DESIGN-${code}-test.md`,
          code,
          propertyIds: propIds,
        });
        const specs = makeSpecs([reqFile, designFile]);

        const { map, noChange } = buildRenumberMap(code, specs);

        expect(noChange).toBe(true);
        expect(map.entries.size).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});
