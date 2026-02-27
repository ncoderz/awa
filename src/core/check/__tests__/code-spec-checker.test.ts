// @awa-component: CHK-CodeSpecChecker
// @awa-test: CHK-3_AC-1
// @awa-test: CHK-4_AC-1
// @awa-test: CHK-6_AC-1
// @awa-test: CHK_P-1
// @awa-test: CHK_P-2
// @awa-test: CHK_P-4

import { describe, expect, test } from 'vitest';
import { checkCodeAgainstSpec } from '../code-spec-checker.js';
import type { CheckConfig, CodeMarker, MarkerScanResult, SpecParseResult } from '../types.js';
import { DEFAULT_CHECK_CONFIG } from '../types.js';

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

function makeMarkers(markers: CodeMarker[]): MarkerScanResult {
  return { markers };
}

function makeConfig(overrides: Partial<CheckConfig> = {}): CheckConfig {
  return { ...DEFAULT_CHECK_CONFIG, ...overrides };
}

describe('CodeSpecChecker', () => {
  // @awa-test: CHK_P-1
  // @awa-test: CHK-3_AC-1
  test('reports orphaned impl marker when ID not in specs', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'FOO-1_AC-1', filePath: 'src/foo.ts', line: 5 },
    ]);
    const specs = makeSpecs({ allIds: new Set(['BAR-1_AC-1']) });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-marker');
    expect(orphaned).toHaveLength(1);
    expect(orphaned[0]).toMatchObject({
      severity: 'error',
      id: 'FOO-1_AC-1',
    });
  });

  // @awa-test: CHK_P-1
  test('does not report impl marker when ID exists in specs', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/config.ts', line: 10 },
    ]);
    const specs = makeSpecs({ allIds: new Set(['CFG-1_AC-1']) });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-marker');
    expect(orphaned).toHaveLength(0);
  });

  // @awa-test: CHK-3_AC-1
  test('reports orphaned component marker when name not in specs', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'FOO-Loader', filePath: 'src/foo.ts', line: 1 },
    ]);
    const specs = makeSpecs({ componentNames: new Set(['BAR-Loader']) });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-marker');
    expect(orphaned).toHaveLength(1);
    expect(orphaned[0]).toMatchObject({
      severity: 'error',
      id: 'FOO-Loader',
    });
  });

  // @awa-test: CHK_P-2
  // @awa-test: CHK-4_AC-1
  test('reports uncovered ACs when no test marker references them', () => {
    const markers = makeMarkers([{ type: 'test', id: 'CFG-1_AC-1', filePath: 'test.ts', line: 5 }]);
    const specs = makeSpecs({
      acIds: new Set(['CFG-1_AC-1', 'CFG-1_AC-2']),
      allIds: new Set(['CFG-1_AC-1', 'CFG-1_AC-2']),
      specFiles: [
        {
          filePath: 'specs/REQ-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: ['CFG-1_AC-1', 'CFG-1_AC-2'],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const uncovered = result.findings.filter((f) => f.code === 'uncovered-ac');
    expect(uncovered).toHaveLength(1);
    expect(uncovered[0]).toMatchObject({
      severity: 'warning',
      id: 'CFG-1_AC-2',
    });
  });

  // @awa-test: CHK_P-2
  test('does not report AC as uncovered when test marker exists', () => {
    const markers = makeMarkers([{ type: 'test', id: 'CFG-1_AC-1', filePath: 'test.ts', line: 5 }]);
    const specs = makeSpecs({
      acIds: new Set(['CFG-1_AC-1']),
      allIds: new Set(['CFG-1_AC-1']),
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const uncovered = result.findings.filter((f) => f.code === 'uncovered-ac');
    expect(uncovered).toHaveLength(0);
  });

  // @awa-test: CHK_P-4
  // @awa-test: CHK-6_AC-1
  test('reports invalid ID format for impl markers', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'bad_id_format', filePath: 'src/foo.ts', line: 3 },
    ]);
    const specs = makeSpecs();

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const invalid = result.findings.filter((f) => f.code === 'invalid-id-format');
    expect(invalid).toHaveLength(1);
    expect(invalid[0]).toMatchObject({
      severity: 'error',
      id: 'bad_id_format',
    });
  });

  // @awa-test: CHK_P-4
  test('does not report valid IDs as format errors', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/a.ts', line: 1 },
      { type: 'impl', id: 'CFG-1.2_AC-3', filePath: 'src/b.ts', line: 1 },
      { type: 'test', id: 'CFG_P-1', filePath: 'test.ts', line: 1 },
      { type: 'impl', id: 'CFG-1', filePath: 'src/c.ts', line: 1 },
    ]);
    const specs = makeSpecs({
      allIds: new Set(['CFG-1_AC-1', 'CFG-1.2_AC-3', 'CFG_P-1', 'CFG-1']),
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const invalid = result.findings.filter((f) => f.code === 'invalid-id-format');
    expect(invalid).toHaveLength(0);
  });

  // @awa-test: CHK-6_AC-1
  test('skips ID format check for component markers', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-ConfigLoader', filePath: 'src/a.ts', line: 1 },
    ]);
    const specs = makeSpecs({ componentNames: new Set(['CFG-ConfigLoader']) });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const invalid = result.findings.filter((f) => f.code === 'invalid-id-format');
    expect(invalid).toHaveLength(0);
  });

  // @awa-test: CHK_P-1
  test('reports multiple orphaned markers in different files', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'A-1_AC-1', filePath: 'src/a.ts', line: 1 },
      { type: 'impl', id: 'B-1_AC-1', filePath: 'src/b.ts', line: 1 },
    ]);
    const specs = makeSpecs({ allIds: new Set() });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-marker');
    expect(orphaned).toHaveLength(2);
  });
});
