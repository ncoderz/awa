import { describe, expect, test } from 'vitest';
import type { MarkerScanResult, SpecParseResult } from '../../check/types.js';
import { buildTraceIndex } from '../index-builder.js';

// @awa-test: TRC-1_AC-1

/** Helper to create a minimal SpecParseResult with sensible defaults. */
function makeSpecs(overrides: Partial<SpecParseResult> = {}): SpecParseResult {
  return {
    requirementIds: overrides.requirementIds ?? new Set(),
    acIds: overrides.acIds ?? new Set(),
    propertyIds: overrides.propertyIds ?? new Set(),
    componentNames: overrides.componentNames ?? new Set(),
    allIds: overrides.allIds ?? new Set(),
    specFiles: overrides.specFiles ?? [],
    idLocations: overrides.idLocations ?? new Map(),
  };
}

function makeMarkers(overrides: Partial<MarkerScanResult> = {}): MarkerScanResult {
  return {
    markers: overrides.markers ?? [],
    findings: overrides.findings ?? [],
  };
}

describe('buildTraceIndex', () => {
  test('builds reqToACs and acToReq from spec data', () => {
    const specs = makeSpecs({
      requirementIds: new Set(['DIFF-1', 'DIFF-2']),
      acIds: new Set(['DIFF-1_AC-1', 'DIFF-1_AC-2', 'DIFF-2_AC-1']),
    });

    const index = buildTraceIndex(specs, makeMarkers());

    expect([...(index.reqToACs.get('DIFF-1') ?? [])]).toEqual(['DIFF-1_AC-1', 'DIFF-1_AC-2']);
    expect([...(index.reqToACs.get('DIFF-2') ?? [])]).toEqual(['DIFF-2_AC-1']);
    expect(index.acToReq.get('DIFF-1_AC-1')).toBe('DIFF-1');
    expect(index.acToReq.get('DIFF-2_AC-1')).toBe('DIFF-2');
  });

  test('handles sub-requirement ACs correctly', () => {
    const specs = makeSpecs({
      requirementIds: new Set(['DIFF-1', 'DIFF-1.1']),
      acIds: new Set(['DIFF-1.1_AC-1', 'DIFF-1.1_AC-2']),
    });

    const index = buildTraceIndex(specs, makeMarkers());

    expect([...(index.reqToACs.get('DIFF-1.1') ?? [])]).toEqual(['DIFF-1.1_AC-1', 'DIFF-1.1_AC-2']);
    expect(index.acToReq.get('DIFF-1.1_AC-1')).toBe('DIFF-1.1');
  });

  test('builds marker location maps from code markers', () => {
    const specs = makeSpecs({
      requirementIds: new Set(['DIFF-1']),
      acIds: new Set(['DIFF-1_AC-1']),
      propertyIds: new Set(['DIFF_P-1']),
      componentNames: new Set(['DIFF-DiffEngine']),
    });

    const markers = makeMarkers({
      markers: [
        { type: 'impl', id: 'DIFF-1_AC-1', filePath: 'src/differ.ts', line: 42 },
        { type: 'impl', id: 'DIFF-1_AC-1', filePath: 'src/differ.ts', line: 87 },
        { type: 'test', id: 'DIFF-1_AC-1', filePath: 'src/__tests__/differ.test.ts', line: 15 },
        { type: 'test', id: 'DIFF_P-1', filePath: 'src/__tests__/differ.test.ts', line: 30 },
        { type: 'component', id: 'DIFF-DiffEngine', filePath: 'src/differ.ts', line: 1 },
      ],
    });

    const index = buildTraceIndex(specs, markers);

    // impl markers → acToCodeLocations
    expect(index.acToCodeLocations.get('DIFF-1_AC-1')).toEqual([
      { filePath: 'src/differ.ts', line: 42 },
      { filePath: 'src/differ.ts', line: 87 },
    ]);

    // test markers for ACs → acToTestLocations
    expect(index.acToTestLocations.get('DIFF-1_AC-1')).toEqual([
      { filePath: 'src/__tests__/differ.test.ts', line: 15 },
    ]);

    // test markers for properties → propertyToTestLocations
    expect(index.propertyToTestLocations.get('DIFF_P-1')).toEqual([
      { filePath: 'src/__tests__/differ.test.ts', line: 30 },
    ]);

    // component markers → componentToCodeLocations
    expect(index.componentToCodeLocations.get('DIFF-DiffEngine')).toEqual([
      { filePath: 'src/differ.ts', line: 1 },
    ]);
  });

  test('builds design cross-reference maps from IMPLEMENTS', () => {
    const specs = makeSpecs({
      requirementIds: new Set(['DIFF-1']),
      acIds: new Set(['DIFF-1_AC-1', 'DIFF-1_AC-2']),
      componentNames: new Set(['DIFF-DiffEngine']),
      allIds: new Set(['DIFF-1', 'DIFF-1_AC-1', 'DIFF-1_AC-2', 'DIFF-DiffEngine']),
      specFiles: [
        {
          filePath: '.awa/specs/DESIGN-DIFF-diff.md',
          code: 'DIFF',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['DIFF-DiffEngine'],
          crossRefs: [
            {
              type: 'implements',
              ids: ['DIFF-1_AC-1', 'DIFF-1_AC-2'],
              filePath: '.awa/specs/DESIGN-DIFF-diff.md',
              line: 25,
            },
          ],
          idLocations: new Map([
            ['DIFF-DiffEngine', { filePath: '.awa/specs/DESIGN-DIFF-diff.md', line: 20 }],
          ]),
        },
      ],
      idLocations: new Map([
        ['DIFF-DiffEngine', { filePath: '.awa/specs/DESIGN-DIFF-diff.md', line: 20 }],
      ]),
    });

    const index = buildTraceIndex(specs, makeMarkers());

    expect([...(index.acToDesignComponents.get('DIFF-1_AC-1') ?? [])]).toEqual(['DIFF-DiffEngine']);
    expect([...(index.acToDesignComponents.get('DIFF-1_AC-2') ?? [])]).toEqual(['DIFF-DiffEngine']);
    expect([...(index.componentToACs.get('DIFF-DiffEngine') ?? [])]).toEqual([
      'DIFF-1_AC-1',
      'DIFF-1_AC-2',
    ]);
  });

  test('builds property→AC maps from VALIDATES cross-references', () => {
    const specs = makeSpecs({
      requirementIds: new Set(['DIFF-1']),
      acIds: new Set(['DIFF-1_AC-1']),
      propertyIds: new Set(['DIFF_P-1']),
      componentNames: new Set(['DIFF-DiffEngine']),
      specFiles: [
        {
          filePath: '.awa/specs/DESIGN-DIFF-diff.md',
          code: 'DIFF',
          requirementIds: [],
          acIds: [],
          propertyIds: ['DIFF_P-1'],
          componentNames: ['DIFF-DiffEngine'],
          crossRefs: [
            {
              type: 'implements',
              ids: ['DIFF-1_AC-1'],
              filePath: '.awa/specs/DESIGN-DIFF-diff.md',
              line: 25,
            },
            {
              type: 'validates',
              ids: ['DIFF-1_AC-1'],
              filePath: '.awa/specs/DESIGN-DIFF-diff.md',
              line: 32,
            },
          ],
          idLocations: new Map([
            ['DIFF-DiffEngine', { filePath: '.awa/specs/DESIGN-DIFF-diff.md', line: 20 }],
            ['DIFF_P-1', { filePath: '.awa/specs/DESIGN-DIFF-diff.md', line: 30 }],
          ]),
        },
      ],
      idLocations: new Map([
        ['DIFF_P-1', { filePath: '.awa/specs/DESIGN-DIFF-diff.md', line: 30 }],
      ]),
    });

    const index = buildTraceIndex(specs, makeMarkers());

    expect([...(index.propertyToACs.get('DIFF_P-1') ?? [])]).toEqual(['DIFF-1_AC-1']);
  });

  test('allIds contains all known IDs', () => {
    const specs = makeSpecs({
      requirementIds: new Set(['DIFF-1']),
      acIds: new Set(['DIFF-1_AC-1']),
      propertyIds: new Set(['DIFF_P-1']),
      componentNames: new Set(['DIFF-DiffEngine']),
    });

    const index = buildTraceIndex(specs, makeMarkers());

    expect(index.allIds.has('DIFF-1')).toBe(true);
    expect(index.allIds.has('DIFF-1_AC-1')).toBe(true);
    expect(index.allIds.has('DIFF_P-1')).toBe(true);
    expect(index.allIds.has('DIFF-DiffEngine')).toBe(true);
  });

  test('copies idLocations from specs', () => {
    const idLocs = new Map([['DIFF-1', { filePath: '.awa/specs/REQ-DIFF-diff.md', line: 18 }]]);

    const specs = makeSpecs({
      requirementIds: new Set(['DIFF-1']),
      idLocations: idLocs,
    });

    const index = buildTraceIndex(specs, makeMarkers());

    expect(index.idLocations.get('DIFF-1')).toEqual({
      filePath: '.awa/specs/REQ-DIFF-diff.md',
      line: 18,
    });
  });

  test('handles empty inputs gracefully', () => {
    const index = buildTraceIndex(makeSpecs(), makeMarkers());

    expect(index.reqToACs.size).toBe(0);
    expect(index.acToReq.size).toBe(0);
    expect(index.allIds.size).toBe(0);
  });
});
