import { describe, expect, test } from 'vitest';
import { detectIdType, resolveTrace } from '../resolver.js';
import type { CodeLocation, TraceIndex } from '../types.js';

// @awa-test: TRC-3_AC-1, TRC-3_AC-2, TRC-3_AC-3, TRC-3_AC-4, TRC-3_AC-5
// @awa-test: TRC-11_AC-1, TRC-11_AC-2

/** Helper to create a fully populated TraceIndex for testing. */
function makeTestIndex(): TraceIndex {
  const reqToACs = new Map<string, readonly string[]>([['DIFF-1', ['DIFF-1_AC-1', 'DIFF-1_AC-2']]]);

  const acToDesignComponents = new Map<string, readonly string[]>([
    ['DIFF-1_AC-1', ['DIFF-DiffEngine']],
    ['DIFF-1_AC-2', ['DIFF-DiffEngine']],
  ]);

  const acToCodeLocations = new Map<string, readonly CodeLocation[]>([
    ['DIFF-1_AC-1', [{ filePath: 'src/differ.ts', line: 42 }]],
    ['DIFF-1_AC-2', [{ filePath: 'src/differ.ts', line: 87 }]],
  ]);

  const acToTestLocations = new Map<string, readonly CodeLocation[]>([
    ['DIFF-1_AC-1', [{ filePath: 'src/__tests__/differ.test.ts', line: 15 }]],
  ]);

  const propertyToTestLocations = new Map<string, readonly CodeLocation[]>([
    ['DIFF_P-1', [{ filePath: 'src/__tests__/differ.test.ts', line: 30 }]],
  ]);

  const componentToCodeLocations = new Map<string, readonly CodeLocation[]>([
    ['DIFF-DiffEngine', [{ filePath: 'src/differ.ts', line: 1 }]],
  ]);

  const acToReq = new Map<string, string>([
    ['DIFF-1_AC-1', 'DIFF-1'],
    ['DIFF-1_AC-2', 'DIFF-1'],
  ]);

  const componentToACs = new Map<string, readonly string[]>([
    ['DIFF-DiffEngine', ['DIFF-1_AC-1', 'DIFF-1_AC-2']],
  ]);

  const propertyToACs = new Map<string, readonly string[]>([['DIFF_P-1', ['DIFF-1_AC-1']]]);

  const idLocations = new Map<string, CodeLocation>([
    ['DIFF-1', { filePath: '.awa/specs/REQ-DIFF-diff.md', line: 18 }],
    ['DIFF-1_AC-1', { filePath: '.awa/specs/REQ-DIFF-diff.md', line: 22 }],
    ['DIFF-1_AC-2', { filePath: '.awa/specs/REQ-DIFF-diff.md', line: 24 }],
    ['DIFF-DiffEngine', { filePath: '.awa/specs/DESIGN-DIFF-diff.md', line: 20 }],
    ['DIFF_P-1', { filePath: '.awa/specs/DESIGN-DIFF-diff.md', line: 30 }],
  ]);

  const allIds = new Set(['DIFF-1', 'DIFF-1_AC-1', 'DIFF-1_AC-2', 'DIFF-DiffEngine', 'DIFF_P-1']);

  return {
    reqToACs,
    acToDesignComponents,
    acToCodeLocations,
    acToTestLocations,
    propertyToTestLocations,
    componentToCodeLocations,
    acToReq,
    componentToACs,
    propertyToACs,
    idLocations,
    allIds,
  };
}

describe('detectIdType', () => {
  test('detects requirement IDs', () => {
    expect(detectIdType('DIFF-1')).toBe('requirement');
    expect(detectIdType('DIFF-1.1')).toBe('requirement');
    expect(detectIdType('CHK-12')).toBe('requirement');
  });

  test('detects AC IDs', () => {
    expect(detectIdType('DIFF-1_AC-1')).toBe('ac');
    expect(detectIdType('DIFF-1.1_AC-2')).toBe('ac');
  });

  test('detects property IDs', () => {
    expect(detectIdType('DIFF_P-1')).toBe('property');
    expect(detectIdType('CHK_P-2')).toBe('property');
  });

  test('detects component names', () => {
    expect(detectIdType('DIFF-DiffEngine')).toBe('component');
    expect(detectIdType('CHK-MarkerScanner')).toBe('component');
  });
});

describe('resolveTrace', () => {
  test('resolves full chain from requirement ID', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-1'], { direction: 'both' });

    expect(result.notFound).toEqual([]);
    expect(result.chains).toHaveLength(1);

    const chain = result.chains[0]!;
    expect(chain.queryId).toBe('DIFF-1');
    expect(chain.requirement?.id).toBe('DIFF-1');
    expect(chain.acs).toHaveLength(2);
    expect(chain.designComponents).toHaveLength(1);
    expect(chain.designComponents[0]!.id).toBe('DIFF-DiffEngine');
    expect(chain.implementations.length).toBeGreaterThanOrEqual(1);
    expect(chain.tests.length).toBeGreaterThanOrEqual(1);
  });

  test('resolves from AC ID with both directions', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-1_AC-1'], { direction: 'both' });

    const chain = result.chains[0]!;
    expect(chain.requirement?.id).toBe('DIFF-1');
    expect(chain.acs).toHaveLength(1);
    expect(chain.acs[0]!.id).toBe('DIFF-1_AC-1');
    expect(chain.designComponents).toHaveLength(1);
    expect(chain.implementations).toHaveLength(1);
    expect(chain.tests).toHaveLength(1);
  });

  test('resolves from component with reverse traversal', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-DiffEngine'], { direction: 'both' });

    const chain = result.chains[0]!;
    expect(chain.designComponents).toHaveLength(1);
    expect(chain.acs).toHaveLength(2);
    expect(chain.requirement?.id).toBe('DIFF-1');
    // Forward: component → code locations
    expect(chain.implementations).toHaveLength(1);
  });

  test('resolves from property ID', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF_P-1'], { direction: 'both' });

    const chain = result.chains[0]!;
    expect(chain.properties).toHaveLength(1);
    expect(chain.tests).toHaveLength(1);
    // Reverse: property → AC → requirement
    expect(chain.acs).toHaveLength(1);
    expect(chain.requirement?.id).toBe('DIFF-1');
  });

  // @awa-test: TRC-3_AC-2
  test('forward-only direction skips reverse links', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-1_AC-1'], { direction: 'forward' });

    const chain = result.chains[0]!;
    expect(chain.requirement).toBeUndefined();
    expect(chain.acs).toHaveLength(1);
    expect(chain.implementations).toHaveLength(1);
  });

  // @awa-test: TRC-3_AC-3
  test('reverse-only direction skips forward links', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-1_AC-1'], { direction: 'reverse' });

    const chain = result.chains[0]!;
    expect(chain.requirement?.id).toBe('DIFF-1');
    expect(chain.designComponents).toHaveLength(0);
    expect(chain.implementations).toHaveLength(0);
    expect(chain.tests).toHaveLength(0);
  });

  // @awa-test: TRC-3_AC-4
  test('depth=1 limits traversal', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-1'], { direction: 'forward', depth: 1 });

    const chain = result.chains[0]!;
    expect(chain.requirement?.id).toBe('DIFF-1');
    // depth=1: requirement → ACs, but no further
    expect(chain.acs).toHaveLength(2);
    expect(chain.designComponents).toHaveLength(0);
    expect(chain.implementations).toHaveLength(0);
    expect(chain.tests).toHaveLength(0);
  });

  // @awa-test: TRC-3_AC-5
  test('scope filtering limits by feature code', () => {
    const index = makeTestIndex();
    // Add another feature to the index
    (index.allIds as Set<string>).add('OTHER-1');
    (index.allIds as Set<string>).add('OTHER-1_AC-1');

    const result = resolveTrace(index, ['DIFF-1'], { direction: 'both', scope: 'DIFF' });

    const chain = result.chains[0]!;
    // All results should have DIFF prefix
    for (const ac of chain.acs) {
      expect(ac.id.startsWith('DIFF')).toBe(true);
    }
  });

  // @awa-test: TRC-11_AC-1
  test('noCode filters out implementations', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-1_AC-1'], {
      direction: 'both',
      noCode: true,
    });

    const chain = result.chains[0]!;
    expect(chain.implementations).toHaveLength(0);
    expect(chain.tests.length).toBeGreaterThanOrEqual(1);
  });

  // @awa-test: TRC-11_AC-2
  test('noTests filters out tests and properties', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-1_AC-1'], {
      direction: 'both',
      noTests: true,
    });

    const chain = result.chains[0]!;
    expect(chain.tests).toHaveLength(0);
    expect(chain.implementations.length).toBeGreaterThanOrEqual(1);
  });

  test('reports not-found IDs', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['NOPE-999'], { direction: 'both' });

    expect(result.chains).toHaveLength(0);
    expect(result.notFound).toEqual(['NOPE-999']);
  });

  test('handles multiple IDs', () => {
    const index = makeTestIndex();
    const result = resolveTrace(index, ['DIFF-1_AC-1', 'DIFF_P-1'], { direction: 'both' });

    expect(result.chains).toHaveLength(2);
    expect(result.chains[0]!.queryId).toBe('DIFF-1_AC-1');
    expect(result.chains[1]!.queryId).toBe('DIFF_P-1');
  });

  test('handles partial chains (no design components)', () => {
    const index: TraceIndex = {
      reqToACs: new Map([['TEST-1', ['TEST-1_AC-1']]]),
      acToDesignComponents: new Map(),
      acToCodeLocations: new Map(),
      acToTestLocations: new Map(),
      propertyToTestLocations: new Map(),
      componentToCodeLocations: new Map(),
      acToReq: new Map([['TEST-1_AC-1', 'TEST-1']]),
      componentToACs: new Map(),
      propertyToACs: new Map(),
      idLocations: new Map([
        ['TEST-1', { filePath: 'specs/REQ-TEST.md', line: 5 }],
        ['TEST-1_AC-1', { filePath: 'specs/REQ-TEST.md', line: 8 }],
      ]),
      allIds: new Set(['TEST-1', 'TEST-1_AC-1']),
    };

    const result = resolveTrace(index, ['TEST-1'], { direction: 'both' });

    const chain = result.chains[0]!;
    expect(chain.requirement?.id).toBe('TEST-1');
    expect(chain.acs).toHaveLength(1);
    expect(chain.designComponents).toHaveLength(0);
    expect(chain.implementations).toHaveLength(0);
    expect(chain.tests).toHaveLength(0);
  });
});
