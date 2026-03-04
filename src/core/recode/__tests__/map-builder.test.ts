// @awa-test: RCOD_P-1, RCOD_P-2, RCOD_P-3
// @awa-test: RCOD-1_AC-1, RCOD-1_AC-2, RCOD-1_AC-3, RCOD-1_AC-4, RCOD-1_AC-5

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { SpecFile, SpecParseResult } from '../../check/types.js';
import { buildRecodeMap } from '../map-builder.js';
import { RecodeError } from '../types.js';

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

describe('buildRecodeMap', () => {
  // @awa-test: RCOD-1_AC-1
  it('maps source requirements to target with offset', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1', 'SRC-2'],
      acIds: [],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: ['TGT-1', 'TGT-3', 'TGT-5'],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, targetReq]);

    const { map, noChange } = buildRecodeMap('SRC', 'TGT', specs);

    expect(noChange).toBe(false);
    // Highest target req is 5, so SRC-1 → TGT-6, SRC-2 → TGT-7
    expect(map.entries.get('SRC-1')).toBe('TGT-6');
    expect(map.entries.get('SRC-2')).toBe('TGT-7');
  });

  // @awa-test: RCOD-1_AC-2
  it('maps subrequirements with updated parent prefix and offset', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1', 'SRC-1.1', 'SRC-1.2'],
      acIds: [],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: ['TGT-1', 'TGT-2'],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, targetReq]);

    const { map } = buildRecodeMap('SRC', 'TGT', specs);

    // TGT highest is 2, so SRC-1 → TGT-3
    expect(map.entries.get('SRC-1')).toBe('TGT-3');
    expect(map.entries.get('SRC-1.1')).toBe('TGT-3.1');
    expect(map.entries.get('SRC-1.2')).toBe('TGT-3.2');
  });

  // @awa-test: RCOD-1_AC-3
  it('maps acceptance criteria with updated parent prefix and offset', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1'],
      acIds: ['SRC-1_AC-1', 'SRC-1_AC-2'],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: ['TGT-1', 'TGT-2', 'TGT-3'],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, targetReq]);

    const { map } = buildRecodeMap('SRC', 'TGT', specs);

    // SRC-1 → TGT-4, so ACs update parent
    expect(map.entries.get('SRC-1_AC-1')).toBe('TGT-4_AC-1');
    expect(map.entries.get('SRC-1_AC-2')).toBe('TGT-4_AC-2');
  });

  it('maps ACs on subrequirements with updated parent prefix', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1', 'SRC-1.1'],
      acIds: ['SRC-1.1_AC-1', 'SRC-1.1_AC-2'],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: ['TGT-1'],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, targetReq]);

    const { map } = buildRecodeMap('SRC', 'TGT', specs);

    // SRC-1 → TGT-2, SRC-1.1 → TGT-2.1
    expect(map.entries.get('SRC-1.1_AC-1')).toBe('TGT-2.1_AC-1');
    expect(map.entries.get('SRC-1.1_AC-2')).toBe('TGT-2.1_AC-2');
  });

  // @awa-test: RCOD-1_AC-4
  it('maps properties with separate offset from target DESIGN', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1'],
      acIds: [],
    });
    const sourceDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-SRC-feature.md',
      code: 'SRC',
      propertyIds: ['SRC_P-1', 'SRC_P-2'],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: ['TGT-1'],
      acIds: [],
    });
    const targetDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-TGT-feature.md',
      code: 'TGT',
      propertyIds: ['TGT_P-1', 'TGT_P-3'],
    });
    const specs = makeSpecs([sourceReq, sourceDesign, targetReq, targetDesign]);

    const { map } = buildRecodeMap('SRC', 'TGT', specs);

    // Highest target property is 3, so SRC_P-1 → TGT_P-4, SRC_P-2 → TGT_P-5
    expect(map.entries.get('SRC_P-1')).toBe('TGT_P-4');
    expect(map.entries.get('SRC_P-2')).toBe('TGT_P-5');
  });

  it('maps properties starting from 1 when target has no DESIGN', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1'],
      acIds: [],
    });
    const sourceDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-SRC-feature.md',
      code: 'SRC',
      propertyIds: ['SRC_P-1'],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: [],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, sourceDesign, targetReq]);

    const { map } = buildRecodeMap('SRC', 'TGT', specs);

    expect(map.entries.get('SRC_P-1')).toBe('TGT_P-1');
  });

  // @awa-test: RCOD-1_AC-5
  it('maps component name prefixes', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1'],
      acIds: [],
    });
    const sourceDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-SRC-feature.md',
      code: 'SRC',
      componentNames: ['SRC-Parser', 'SRC-Reporter'],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: [],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, sourceDesign, targetReq]);

    const { map } = buildRecodeMap('SRC', 'TGT', specs);

    expect(map.entries.get('SRC-Parser')).toBe('TGT-Parser');
    expect(map.entries.get('SRC-Reporter')).toBe('TGT-Reporter');
  });

  it('returns noChange when source has no IDs', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: [],
      acIds: [],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: [],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, targetReq]);

    const { noChange } = buildRecodeMap('SRC', 'TGT', specs);

    expect(noChange).toBe(true);
  });

  it('handles target with no existing requirements (offset 0)', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1', 'SRC-2'],
      acIds: ['SRC-1_AC-1'],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: [],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, targetReq]);

    const { map } = buildRecodeMap('SRC', 'TGT', specs);

    expect(map.entries.get('SRC-1')).toBe('TGT-1');
    expect(map.entries.get('SRC-2')).toBe('TGT-2');
    expect(map.entries.get('SRC-1_AC-1')).toBe('TGT-1_AC-1');
  });

  it('throws SOURCE_NOT_FOUND when source has no spec files', () => {
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: [],
      acIds: [],
    });
    const specs = makeSpecs([targetReq]);

    expect(() => buildRecodeMap('NOPE', 'TGT', specs)).toThrow(RecodeError);
    expect(() => buildRecodeMap('NOPE', 'TGT', specs)).toThrow('No spec files found for source');
  });

  it('succeeds when target code does not exist (recode to new code)', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1', 'SRC-2'],
      acIds: ['SRC-1_AC-1'],
    });
    const specs = makeSpecs([sourceReq]);

    const { map, noChange } = buildRecodeMap('SRC', 'NEW', specs);

    expect(noChange).toBe(false);
    // No target exists, offset is 0
    expect(map.entries.get('SRC-1')).toBe('NEW-1');
    expect(map.entries.get('SRC-2')).toBe('NEW-2');
    expect(map.entries.get('SRC-1_AC-1')).toBe('NEW-1_AC-1');
  });

  it('succeeds when source has only FEAT file (no REQ)', () => {
    const sourceFeat = makeSpecFile({
      filePath: '.awa/specs/FEAT-SRC-feature.md',
      code: 'SRC',
    });
    const targetFeat = makeSpecFile({
      filePath: '.awa/specs/FEAT-TGT-feature.md',
      code: 'TGT',
    });
    const specs = makeSpecs([sourceFeat, targetFeat]);

    const { map, noChange } = buildRecodeMap('SRC', 'TGT', specs);

    expect(noChange).toBe(true);
    expect(map.entries.size).toBe(0);
  });

  it('maps properties and components when only DESIGN files exist (no REQ)', () => {
    const sourceFeat = makeSpecFile({
      filePath: '.awa/specs/FEAT-SRC-feature.md',
      code: 'SRC',
    });
    const sourceDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-SRC-feature.md',
      code: 'SRC',
      propertyIds: ['SRC_P-1', 'SRC_P-2'],
      componentNames: ['SRC-Engine'],
    });
    const targetFeat = makeSpecFile({
      filePath: '.awa/specs/FEAT-TGT-feature.md',
      code: 'TGT',
    });
    const targetDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-TGT-feature.md',
      code: 'TGT',
      propertyIds: ['TGT_P-1'],
    });
    const specs = makeSpecs([sourceFeat, sourceDesign, targetFeat, targetDesign]);

    const { map, noChange } = buildRecodeMap('SRC', 'TGT', specs);

    expect(noChange).toBe(false);
    expect(map.entries.get('SRC_P-1')).toBe('TGT_P-2');
    expect(map.entries.get('SRC_P-2')).toBe('TGT_P-3');
    expect(map.entries.get('SRC-Engine')).toBe('TGT-Engine');
  });

  it('handles complex scenario with all ID types', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1', 'SRC-1.1', 'SRC-2'],
      acIds: ['SRC-1_AC-1', 'SRC-1.1_AC-1', 'SRC-2_AC-1', 'SRC-2_AC-2'],
    });
    const sourceDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-SRC-feature.md',
      code: 'SRC',
      propertyIds: ['SRC_P-1', 'SRC_P-2'],
      componentNames: ['SRC-Engine', 'SRC-Runner'],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: ['TGT-1', 'TGT-2', 'TGT-3'],
      acIds: ['TGT-1_AC-1'],
    });
    const targetDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-TGT-feature.md',
      code: 'TGT',
      propertyIds: ['TGT_P-1'],
    });
    const specs = makeSpecs([sourceReq, sourceDesign, targetReq, targetDesign]);

    const { map, noChange } = buildRecodeMap('SRC', 'TGT', specs);

    expect(noChange).toBe(false);
    // Requirements: offset 3
    expect(map.entries.get('SRC-1')).toBe('TGT-4');
    expect(map.entries.get('SRC-1.1')).toBe('TGT-4.1');
    expect(map.entries.get('SRC-2')).toBe('TGT-5');
    // ACs
    expect(map.entries.get('SRC-1_AC-1')).toBe('TGT-4_AC-1');
    expect(map.entries.get('SRC-1.1_AC-1')).toBe('TGT-4.1_AC-1');
    expect(map.entries.get('SRC-2_AC-1')).toBe('TGT-5_AC-1');
    expect(map.entries.get('SRC-2_AC-2')).toBe('TGT-5_AC-2');
    // Properties: offset 1
    expect(map.entries.get('SRC_P-1')).toBe('TGT_P-2');
    expect(map.entries.get('SRC_P-2')).toBe('TGT_P-3');
    // Components
    expect(map.entries.get('SRC-Engine')).toBe('TGT-Engine');
    expect(map.entries.get('SRC-Runner')).toBe('TGT-Runner');
  });

  it('skips source DESIGN gracefully when missing', () => {
    const sourceReq = makeSpecFile({
      filePath: '.awa/specs/REQ-SRC-feature.md',
      code: 'SRC',
      requirementIds: ['SRC-1'],
      acIds: ['SRC-1_AC-1'],
    });
    const targetReq = makeSpecFile({
      filePath: '.awa/specs/REQ-TGT-feature.md',
      code: 'TGT',
      requirementIds: ['TGT-1'],
      acIds: [],
    });
    const specs = makeSpecs([sourceReq, targetReq]);

    const { map, noChange } = buildRecodeMap('SRC', 'TGT', specs);

    expect(noChange).toBe(false);
    expect(map.entries.get('SRC-1')).toBe('TGT-2');
    expect(map.entries.get('SRC-1_AC-1')).toBe('TGT-2_AC-1');
    // No property or component entries
    expect(map.entries.size).toBe(2);
  });

  it('skips source REQ gracefully when missing', () => {
    const sourceDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-SRC-feature.md',
      code: 'SRC',
      propertyIds: ['SRC_P-1'],
      componentNames: ['SRC-Runner'],
    });
    const targetDesign = makeSpecFile({
      filePath: '.awa/specs/DESIGN-TGT-feature.md',
      code: 'TGT',
      propertyIds: [],
    });
    const specs = makeSpecs([sourceDesign, targetDesign]);

    const { map, noChange } = buildRecodeMap('SRC', 'TGT', specs);

    expect(noChange).toBe(false);
    expect(map.entries.get('SRC_P-1')).toBe('TGT_P-1');
    expect(map.entries.get('SRC-Runner')).toBe('TGT-Runner');
    // No requirement entries
    expect(map.entries.size).toBe(2);
  });
});

// --- Property-Based Tests ---

describe('property-based: buildRecodeMap', () => {
  // @awa-test: RCOD_P-1
  it('target IDs start after max existing target number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (targetMax, sourceCount) => {
          const sourceReqIds = Array.from({ length: sourceCount }, (_, i) => `SRC-${i + 1}`);
          const targetReqIds =
            targetMax > 0 ? Array.from({ length: targetMax }, (_, i) => `TGT-${i + 1}`) : [];

          const sourceReq = makeSpecFile({
            filePath: '.awa/specs/REQ-SRC-feature.md',
            code: 'SRC',
            requirementIds: sourceReqIds,
            acIds: [],
          });
          const targetReq = makeSpecFile({
            filePath: '.awa/specs/REQ-TGT-feature.md',
            code: 'TGT',
            requirementIds: targetReqIds,
            acIds: [],
          });
          const specs = makeSpecs([sourceReq, targetReq]);

          const { map } = buildRecodeMap('SRC', 'TGT', specs);

          // All new target IDs should be > targetMax
          for (const newId of map.entries.values()) {
            const match = newId.match(/^TGT-(\d+)$/);
            if (match) {
              expect(Number.parseInt(match[1] as string, 10)).toBeGreaterThan(targetMax);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // @awa-test: RCOD_P-2
  it('all derived IDs are included in the map', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 3 }),
        (reqCount, subReqCount) => {
          const reqIds: string[] = [];
          const acIds: string[] = [];
          for (let i = 1; i <= reqCount; i++) {
            reqIds.push(`SRC-${i}`);
            acIds.push(`SRC-${i}_AC-1`);
            for (let j = 1; j <= subReqCount; j++) {
              reqIds.push(`SRC-${i}.${j}`);
              acIds.push(`SRC-${i}.${j}_AC-1`);
            }
          }

          const sourceReq = makeSpecFile({
            filePath: '.awa/specs/REQ-SRC-feature.md',
            code: 'SRC',
            requirementIds: reqIds,
            acIds,
          });
          const targetReq = makeSpecFile({
            filePath: '.awa/specs/REQ-TGT-feature.md',
            code: 'TGT',
            requirementIds: [],
            acIds: [],
          });
          const specs = makeSpecs([sourceReq, targetReq]);

          const { map } = buildRecodeMap('SRC', 'TGT', specs);

          // Every source ID should be in the map
          for (const id of [...reqIds, ...acIds]) {
            expect(map.entries.has(id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // @awa-test: RCOD_P-3
  it('only source code IDs appear as map keys', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (reqCount: number) => {
        const sourceReqIds = Array.from({ length: reqCount }, (_, i) => `SRC-${i + 1}`);
        const targetReqIds = ['TGT-1', 'TGT-2'];

        const sourceReq = makeSpecFile({
          filePath: '.awa/specs/REQ-SRC-feature.md',
          code: 'SRC',
          requirementIds: sourceReqIds,
          acIds: [],
        });
        const targetReq = makeSpecFile({
          filePath: '.awa/specs/REQ-TGT-feature.md',
          code: 'TGT',
          requirementIds: targetReqIds,
          acIds: [],
        });
        const specs = makeSpecs([sourceReq, targetReq]);

        const { map } = buildRecodeMap('SRC', 'TGT', specs);

        // Every key should start with SRC (source code prefix)
        for (const key of map.entries.keys()) {
          expect(key.startsWith('SRC-') || key.startsWith('SRC_')).toBe(true);
        }
        // Every value should start with TGT (target code prefix)
        for (const value of map.entries.values()) {
          expect(value.startsWith('TGT-') || value.startsWith('TGT_')).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
