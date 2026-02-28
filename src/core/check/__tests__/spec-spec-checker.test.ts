// @awa-component: CHK-SpecSpecChecker
// @awa-test: CHK-5_AC-1
// @awa-test: CHK-7_AC-1
// @awa-test: CHK_P-3

import { describe, expect, test } from 'vitest';
import { checkSpecAgainstSpec } from '../spec-spec-checker.js';
import type {
  CheckConfig,
  CodeMarker,
  MarkerScanResult,
  SpecFile,
  SpecParseResult,
} from '../types.js';
import { DEFAULT_CHECK_CONFIG } from '../types.js';

function makeSpecs(
  specFiles: SpecFile[],
  overrides: Partial<SpecParseResult> = {}
): SpecParseResult {
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
    for (const [id, loc] of sf.idLocations ?? []) idLocations.set(id, loc);
  }

  const allIds = new Set([...requirementIds, ...acIds, ...propertyIds, ...componentNames]);

  return {
    requirementIds,
    acIds,
    propertyIds,
    componentNames,
    allIds,
    specFiles,
    idLocations,
    ...overrides,
  };
}

function makeMarkers(markers: CodeMarker[] = []): MarkerScanResult {
  return { markers, findings: [] };
}

function makeConfig(): CheckConfig {
  return { ...DEFAULT_CHECK_CONFIG };
}

describe('SpecSpecChecker', () => {
  // @awa-test: CHK_P-3
  // @awa-test: CHK-5_AC-1
  test('reports broken cross-reference when IMPLEMENTS target does not exist', () => {
    const specs = makeSpecs([
      {
        filePath: 'specs/DESIGN-X-x.md',
        code: 'X',
        requirementIds: [],
        acIds: [],
        propertyIds: [],
        componentNames: ['X-Loader'],
        crossRefs: [
          {
            type: 'implements',
            ids: ['X-1_AC-1', 'NONEXIST-1_AC-1'],
            filePath: 'specs/DESIGN-X-x.md',
            line: 10,
          },
        ],
      },
      {
        filePath: 'specs/REQ-X-x.md',
        code: 'X',
        requirementIds: ['X-1'],
        acIds: ['X-1_AC-1'],
        propertyIds: [],
        componentNames: [],
        crossRefs: [],
      },
    ]);

    const result = checkSpecAgainstSpec(specs, makeMarkers(), makeConfig());

    const broken = result.findings.filter((f) => f.code === 'broken-cross-ref');
    expect(broken).toHaveLength(1);
    expect(broken[0]).toMatchObject({
      severity: 'error',
      id: 'NONEXIST-1_AC-1',
    });
  });

  // @awa-test: CHK_P-3
  test('does not report cross-reference when target exists', () => {
    const specs = makeSpecs([
      {
        filePath: 'specs/DESIGN-X-x.md',
        code: 'X',
        requirementIds: [],
        acIds: [],
        propertyIds: [],
        componentNames: [],
        crossRefs: [
          { type: 'implements', ids: ['X-1_AC-1'], filePath: 'specs/DESIGN-X-x.md', line: 5 },
        ],
      },
      {
        filePath: 'specs/REQ-X-x.md',
        code: 'X',
        requirementIds: ['X-1'],
        acIds: ['X-1_AC-1'],
        propertyIds: [],
        componentNames: [],
        crossRefs: [],
      },
    ]);

    const result = checkSpecAgainstSpec(specs, makeMarkers(), makeConfig());

    const broken = result.findings.filter((f) => f.code === 'broken-cross-ref');
    expect(broken).toHaveLength(0);
  });

  // @awa-test: CHK-7_AC-1
  test('reports orphaned spec file whose CODE is not referenced anywhere', () => {
    const specs = makeSpecs([
      {
        filePath: 'specs/REQ-ORPHAN-orphan.md',
        code: 'ORPHAN',
        requirementIds: ['ORPHAN-1'],
        acIds: ['ORPHAN-1_AC-1'],
        propertyIds: [],
        componentNames: [],
        crossRefs: [],
      },
    ]);

    // No markers reference ORPHAN
    const result = checkSpecAgainstSpec(specs, makeMarkers(), makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-spec');
    expect(orphaned).toHaveLength(1);
    expect(orphaned[0]).toMatchObject({
      severity: 'warning',
      id: 'ORPHAN',
    });
  });

  // @awa-test: CHK-7_AC-1
  test('does not report spec file as orphaned when CODE is referenced by markers', () => {
    const specs = makeSpecs([
      {
        filePath: 'specs/REQ-CFG-config.md',
        code: 'CFG',
        requirementIds: ['CFG-1'],
        acIds: ['CFG-1_AC-1'],
        propertyIds: [],
        componentNames: [],
        crossRefs: [],
      },
    ]);
    const markers = makeMarkers([
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/config.ts', line: 5 },
    ]);

    const result = checkSpecAgainstSpec(specs, markers, makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-spec');
    expect(orphaned).toHaveLength(0);
  });

  // @awa-test: CHK-7_AC-1
  test('does not report spec file as orphaned when CODE is cross-referenced', () => {
    const specs = makeSpecs([
      {
        filePath: 'specs/REQ-FOO-foo.md',
        code: 'FOO',
        requirementIds: ['FOO-1'],
        acIds: ['FOO-1_AC-1'],
        propertyIds: [],
        componentNames: [],
        crossRefs: [],
      },
      {
        filePath: 'specs/DESIGN-FOO-foo.md',
        code: 'FOO',
        requirementIds: [],
        acIds: [],
        propertyIds: [],
        componentNames: [],
        crossRefs: [
          { type: 'implements', ids: ['FOO-1_AC-1'], filePath: 'specs/DESIGN-FOO-foo.md', line: 5 },
        ],
      },
    ]);

    const result = checkSpecAgainstSpec(specs, makeMarkers(), makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-spec');
    expect(orphaned).toHaveLength(0);
  });

  // @awa-test: CHK-7_AC-1
  test('skips ARCHITECTURE.md (no code prefix)', () => {
    const specs = makeSpecs([
      {
        filePath: 'specs/ARCHITECTURE.md',
        code: '',
        requirementIds: [],
        acIds: [],
        propertyIds: [],
        componentNames: [],
        crossRefs: [],
      },
    ]);

    const result = checkSpecAgainstSpec(specs, makeMarkers(), makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-spec');
    expect(orphaned).toHaveLength(0);
  });

  // @awa-test: CHK_P-3
  test('reports broken VALIDATES cross-reference', () => {
    const specs = makeSpecs([
      {
        filePath: 'specs/DESIGN-X-x.md',
        code: 'X',
        requirementIds: [],
        acIds: [],
        propertyIds: ['X_P-1'],
        componentNames: [],
        crossRefs: [
          { type: 'validates', ids: ['GHOST-1_AC-1'], filePath: 'specs/DESIGN-X-x.md', line: 20 },
        ],
      },
    ]);

    const result = checkSpecAgainstSpec(specs, makeMarkers(), makeConfig());

    const broken = result.findings.filter((f) => f.code === 'broken-cross-ref');
    expect(broken).toHaveLength(1);
    expect(broken[0]).toMatchObject({
      severity: 'error',
      id: 'GHOST-1_AC-1',
    });
  });
});
