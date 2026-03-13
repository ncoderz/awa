// @awa-component: CLI-CodeSpecChecker
// @awa-test: CLI-18_AC-1
// @awa-test: CLI-19_AC-1
// @awa-test: CLI-21_AC-1
// @awa-test: CLI-33_AC-1
// @awa-test: CLI-34_AC-1
// @awa-test: CLI-35_AC-1
// @awa-test: CLI-37_AC-1
// @awa-test: CLI_P-8
// @awa-test: CLI_P-9
// @awa-test: CLI_P-11
// @awa-test: CLI_P-13
// @awa-test: CLI_P-14
// @awa-test: CLI_P-15
// @awa-test: CLI_P-16

import { describe, expect, test } from 'vitest';

import { buildComponentAttribution, checkCodeAgainstSpec } from '../code-spec-checker.js';
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
  return { markers, findings: [] };
}

function makeConfig(overrides: Partial<CheckConfig> = {}): CheckConfig {
  return { ...DEFAULT_CHECK_CONFIG, ...overrides };
}

describe('CodeSpecChecker', () => {
  // @awa-test: CLI_P-8
  // @awa-test: CLI-18_AC-1
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

  // @awa-test: CLI_P-8
  test('does not report impl marker when ID exists in specs', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/config.ts', line: 10 },
    ]);
    const specs = makeSpecs({ allIds: new Set(['CFG-1_AC-1']) });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-marker');
    expect(orphaned).toHaveLength(0);
  });

  // @awa-test: CLI-18_AC-1
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

  // @awa-test: CLI_P-9
  // @awa-test: CLI-19_AC-1
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

  // @awa-test: CLI_P-9
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

  // @awa-test: CLI_P-11
  // @awa-test: CLI-21_AC-1
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

  // @awa-test: CLI_P-11
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

  // @awa-test: CLI-21_AC-1
  test('skips ID format check for component markers', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-ConfigLoader', filePath: 'src/a.ts', line: 1 },
    ]);
    const specs = makeSpecs({ componentNames: new Set(['CFG-ConfigLoader']) });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const invalid = result.findings.filter((f) => f.code === 'invalid-id-format');
    expect(invalid).toHaveLength(0);
  });

  // @awa-test: CLI_P-8
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

  // @awa-test: CLI_P-13
  // @awa-test: CLI-33_AC-1
  test('reports uncovered component when no @awa-component marker exists', () => {
    const markers = makeMarkers([]);
    const specs = makeSpecs({
      componentNames: new Set(['CFG-ConfigLoader']),
      allIds: new Set(['CFG-ConfigLoader']),
      specFiles: [
        {
          filePath: 'specs/DESIGN-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['CFG-ConfigLoader'],
          crossRefs: [],
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const uncovered = result.findings.filter((f) => f.code === 'uncovered-component');
    expect(uncovered).toHaveLength(1);
    expect(uncovered[0]).toMatchObject({
      severity: 'warning',
      id: 'CFG-ConfigLoader',
    });
  });

  // @awa-test: CLI_P-13
  test('does not report component as uncovered when @awa-component marker exists', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-ConfigLoader', filePath: 'src/config.ts', line: 1 },
    ]);
    const specs = makeSpecs({
      componentNames: new Set(['CFG-ConfigLoader']),
      allIds: new Set(['CFG-ConfigLoader']),
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const uncovered = result.findings.filter((f) => f.code === 'uncovered-component');
    expect(uncovered).toHaveLength(0);
  });

  // @awa-test: CLI_P-14
  // @awa-test: CLI-34_AC-1
  test('reports unimplemented AC when no @awa-impl marker exists', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/config.ts', line: 10 },
    ]);
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

    const unimplemented = result.findings.filter((f) => f.code === 'unimplemented-ac');
    expect(unimplemented).toHaveLength(1);
    expect(unimplemented[0]).toMatchObject({
      severity: 'warning',
      id: 'CFG-1_AC-2',
    });
  });

  // @awa-test: CLI_P-14
  test('does not report AC as unimplemented when @awa-impl marker exists', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/config.ts', line: 10 },
    ]);
    const specs = makeSpecs({
      acIds: new Set(['CFG-1_AC-1']),
      allIds: new Set(['CFG-1_AC-1']),
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const unimplemented = result.findings.filter((f) => f.code === 'unimplemented-ac');
    expect(unimplemented).toHaveLength(0);
  });

  // @awa-test: CLI_P-15
  // @awa-test: CLI-35_AC-1
  test('reports uncovered property when no @awa-test marker references it', () => {
    const markers = makeMarkers([{ type: 'test', id: 'CFG_P-1', filePath: 'test.ts', line: 5 }]);
    const specs = makeSpecs({
      propertyIds: new Set(['CFG_P-1', 'CFG_P-2']),
      allIds: new Set(['CFG_P-1', 'CFG_P-2']),
      specFiles: [
        {
          filePath: 'specs/DESIGN-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: ['CFG_P-1', 'CFG_P-2'],
          componentNames: [],
          crossRefs: [],
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const uncovered = result.findings.filter((f) => f.code === 'uncovered-property');
    expect(uncovered).toHaveLength(1);
    expect(uncovered[0]).toMatchObject({
      severity: 'warning',
      id: 'CFG_P-2',
    });
  });

  // @awa-test: CLI_P-15
  test('does not report property as uncovered when @awa-test marker exists', () => {
    const markers = makeMarkers([{ type: 'test', id: 'CFG_P-1', filePath: 'test.ts', line: 5 }]);
    const specs = makeSpecs({
      propertyIds: new Set(['CFG_P-1']),
      allIds: new Set(['CFG_P-1']),
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const uncovered = result.findings.filter((f) => f.code === 'uncovered-property');
    expect(uncovered).toHaveLength(0);
  });

  // @awa-test: CLI_P-16
  // @awa-test: CLI-37_AC-1
  test('reports impl-not-in-implements when @awa-impl is not in DESIGN IMPLEMENTS', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-Loader', filePath: 'src/loader.ts', line: 1 },
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/loader.ts', line: 5 },
      { type: 'impl', id: 'CFG-2_AC-1', filePath: 'src/loader.ts', line: 10 },
    ]);
    const specs = makeSpecs({
      componentNames: new Set(['CFG-Loader']),
      allIds: new Set(['CFG-Loader', 'CFG-1_AC-1', 'CFG-2_AC-1']),
      acIds: new Set(['CFG-1_AC-1', 'CFG-2_AC-1']),
      specFiles: [
        {
          filePath: 'specs/DESIGN-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['CFG-Loader'],
          crossRefs: [
            { type: 'implements', ids: ['CFG-1_AC-1'], filePath: 'specs/DESIGN-CFG.md', line: 10 },
          ],
          componentImplements: new Map([['CFG-Loader', ['CFG-1_AC-1']]]),
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const findings = result.findings.filter((f) => f.code === 'impl-not-in-implements');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: 'warning',
      id: 'CFG-2_AC-1',
    });
  });

  // @awa-test: CLI_P-16
  // @awa-test: CLI-37_AC-1
  test('reports implements-not-in-impl when DESIGN IMPLEMENTS has no code @awa-impl', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-Loader', filePath: 'src/loader.ts', line: 1 },
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/loader.ts', line: 5 },
    ]);
    const specs = makeSpecs({
      componentNames: new Set(['CFG-Loader']),
      allIds: new Set(['CFG-Loader', 'CFG-1_AC-1', 'CFG-2_AC-1']),
      acIds: new Set(['CFG-1_AC-1', 'CFG-2_AC-1']),
      specFiles: [
        {
          filePath: 'specs/DESIGN-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['CFG-Loader'],
          crossRefs: [
            {
              type: 'implements',
              ids: ['CFG-1_AC-1', 'CFG-2_AC-1'],
              filePath: 'specs/DESIGN-CFG.md',
              line: 10,
            },
          ],
          componentImplements: new Map([['CFG-Loader', ['CFG-1_AC-1', 'CFG-2_AC-1']]]),
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const findings = result.findings.filter((f) => f.code === 'implements-not-in-impl');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: 'warning',
      id: 'CFG-2_AC-1',
    });
  });

  // @awa-test: CLI_P-16
  test('does not report impl-vs-implements when sets match', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-Loader', filePath: 'src/loader.ts', line: 1 },
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/loader.ts', line: 5 },
    ]);
    const specs = makeSpecs({
      componentNames: new Set(['CFG-Loader']),
      allIds: new Set(['CFG-Loader', 'CFG-1_AC-1']),
      acIds: new Set(['CFG-1_AC-1']),
      specFiles: [
        {
          filePath: 'specs/DESIGN-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['CFG-Loader'],
          crossRefs: [
            { type: 'implements', ids: ['CFG-1_AC-1'], filePath: 'specs/DESIGN-CFG.md', line: 10 },
          ],
          componentImplements: new Map([['CFG-Loader', ['CFG-1_AC-1']]]),
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const implNotIn = result.findings.filter((f) => f.code === 'impl-not-in-implements');
    const implNotImpl = result.findings.filter((f) => f.code === 'implements-not-in-impl');
    expect(implNotIn).toHaveLength(0);
    expect(implNotImpl).toHaveLength(0);
  });

  // @awa-test: CLI-37_AC-1
  test('multi-component file: positional scoping attributes impl to nearest preceding component', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-Loader', filePath: 'src/loader.ts', line: 1 },
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/loader.ts', line: 5 },
      { type: 'component', id: 'CFG-Parser', filePath: 'src/loader.ts', line: 20 },
      { type: 'impl', id: 'CFG-2_AC-1', filePath: 'src/loader.ts', line: 25 },
    ]);
    const specs = makeSpecs({
      componentNames: new Set(['CFG-Loader', 'CFG-Parser']),
      allIds: new Set(['CFG-Loader', 'CFG-Parser', 'CFG-1_AC-1', 'CFG-2_AC-1']),
      acIds: new Set(['CFG-1_AC-1', 'CFG-2_AC-1']),
      specFiles: [
        {
          filePath: 'specs/DESIGN-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['CFG-Loader', 'CFG-Parser'],
          crossRefs: [
            { type: 'implements', ids: ['CFG-1_AC-1'], filePath: 'specs/DESIGN-CFG.md', line: 10 },
            { type: 'implements', ids: ['CFG-2_AC-1'], filePath: 'specs/DESIGN-CFG.md', line: 20 },
          ],
          componentImplements: new Map([
            ['CFG-Loader', ['CFG-1_AC-1']],
            ['CFG-Parser', ['CFG-2_AC-1']],
          ]),
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    // No mismatches — each impl is correctly attributed to its component
    const implNotIn = result.findings.filter((f) => f.code === 'impl-not-in-implements');
    const implNotImpl = result.findings.filter((f) => f.code === 'implements-not-in-impl');
    expect(implNotIn).toHaveLength(0);
    expect(implNotImpl).toHaveLength(0);
  });

  // @awa-test: CLI-37_AC-1
  test('multi-component file: reports error when impl attributed to wrong component by position', () => {
    // Component B's impl appears after Component A (no Component B marker before it)
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-Loader', filePath: 'src/loader.ts', line: 1 },
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/loader.ts', line: 5 },
      { type: 'impl', id: 'CFG-2_AC-1', filePath: 'src/loader.ts', line: 10 },
      { type: 'component', id: 'CFG-Parser', filePath: 'src/loader.ts', line: 20 },
    ]);
    const specs = makeSpecs({
      componentNames: new Set(['CFG-Loader', 'CFG-Parser']),
      allIds: new Set(['CFG-Loader', 'CFG-Parser', 'CFG-1_AC-1', 'CFG-2_AC-1']),
      acIds: new Set(['CFG-1_AC-1', 'CFG-2_AC-1']),
      specFiles: [
        {
          filePath: 'specs/DESIGN-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['CFG-Loader', 'CFG-Parser'],
          crossRefs: [
            { type: 'implements', ids: ['CFG-1_AC-1'], filePath: 'specs/DESIGN-CFG.md', line: 10 },
            { type: 'implements', ids: ['CFG-2_AC-1'], filePath: 'specs/DESIGN-CFG.md', line: 20 },
          ],
          componentImplements: new Map([
            ['CFG-Loader', ['CFG-1_AC-1']],
            ['CFG-Parser', ['CFG-2_AC-1']],
          ]),
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    // CFG-2_AC-1 is positionally under CFG-Loader, not CFG-Parser
    const implNotIn = result.findings.filter((f) => f.code === 'impl-not-in-implements');
    expect(implNotIn).toHaveLength(1);
    expect(implNotIn[0]).toMatchObject({ id: 'CFG-2_AC-1' });

    // CFG-Parser has no impls attributed to it
    const implNotImpl = result.findings.filter((f) => f.code === 'implements-not-in-impl');
    expect(implNotImpl).toHaveLength(1);
    expect(implNotImpl[0]).toMatchObject({ id: 'CFG-2_AC-1' });
  });

  // @awa-test: CLI-37_AC-1
  test('impl/test markers interleaved with component markers are scoped correctly', () => {
    const markers = makeMarkers([
      { type: 'component', id: 'CFG-Loader', filePath: 'src/loader.ts', line: 1 },
      { type: 'impl', id: 'CFG-1_AC-1', filePath: 'src/loader.ts', line: 3 },
      { type: 'impl', id: 'CFG-1_AC-2', filePath: 'src/loader.ts', line: 10 },
      { type: 'component', id: 'CFG-Parser', filePath: 'src/loader.ts', line: 20 },
      { type: 'impl', id: 'CFG-2_AC-1', filePath: 'src/loader.ts', line: 22 },
      { type: 'impl', id: 'CFG-2_AC-2', filePath: 'src/loader.ts', line: 30 },
    ]);
    const specs = makeSpecs({
      componentNames: new Set(['CFG-Loader', 'CFG-Parser']),
      allIds: new Set([
        'CFG-Loader',
        'CFG-Parser',
        'CFG-1_AC-1',
        'CFG-1_AC-2',
        'CFG-2_AC-1',
        'CFG-2_AC-2',
      ]),
      acIds: new Set(['CFG-1_AC-1', 'CFG-1_AC-2', 'CFG-2_AC-1', 'CFG-2_AC-2']),
      specFiles: [
        {
          filePath: 'specs/DESIGN-CFG.md',
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['CFG-Loader', 'CFG-Parser'],
          crossRefs: [],
          componentImplements: new Map([
            ['CFG-Loader', ['CFG-1_AC-1', 'CFG-1_AC-2']],
            ['CFG-Parser', ['CFG-2_AC-1', 'CFG-2_AC-2']],
          ]),
        },
      ],
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig());

    const implNotIn = result.findings.filter((f) => f.code === 'impl-not-in-implements');
    const implNotImpl = result.findings.filter((f) => f.code === 'implements-not-in-impl');
    expect(implNotIn).toHaveLength(0);
    expect(implNotImpl).toHaveLength(0);
  });
});

describe('buildComponentAttribution', () => {
  test('single-component file attributes all impls to that component', () => {
    const markers: CodeMarker[] = [
      { type: 'component', id: 'COMP-A', filePath: 'src/a.ts', line: 1 },
      { type: 'impl', id: 'A-1_AC-1', filePath: 'src/a.ts', line: 5 },
      { type: 'impl', id: 'A-1_AC-2', filePath: 'src/a.ts', line: 10 },
    ];

    const result = buildComponentAttribution(markers);

    expect(result.get('COMP-A')).toEqual(new Set(['A-1_AC-1', 'A-1_AC-2']));
  });

  test('multi-component file with positional scoping', () => {
    const markers: CodeMarker[] = [
      { type: 'component', id: 'COMP-A', filePath: 'src/a.ts', line: 1 },
      { type: 'impl', id: 'A-1_AC-1', filePath: 'src/a.ts', line: 5 },
      { type: 'component', id: 'COMP-B', filePath: 'src/a.ts', line: 20 },
      { type: 'impl', id: 'B-1_AC-1', filePath: 'src/a.ts', line: 25 },
    ];

    const result = buildComponentAttribution(markers);

    expect(result.get('COMP-A')).toEqual(new Set(['A-1_AC-1']));
    expect(result.get('COMP-B')).toEqual(new Set(['B-1_AC-1']));
  });

  test('impl before any component is not attributed', () => {
    const markers: CodeMarker[] = [
      { type: 'impl', id: 'X-1_AC-1', filePath: 'src/a.ts', line: 1 },
      { type: 'component', id: 'COMP-A', filePath: 'src/a.ts', line: 10 },
      { type: 'impl', id: 'A-1_AC-1', filePath: 'src/a.ts', line: 15 },
    ];

    const result = buildComponentAttribution(markers);

    // X-1_AC-1 is not attributed to any component
    expect(result.get('COMP-A')).toEqual(new Set(['A-1_AC-1']));
  });

  test('test markers are attributed like impl markers', () => {
    const markers: CodeMarker[] = [
      { type: 'component', id: 'COMP-A', filePath: 'test/a.ts', line: 1 },
      { type: 'test', id: 'A_P-1', filePath: 'test/a.ts', line: 5 },
      { type: 'component', id: 'COMP-B', filePath: 'test/a.ts', line: 20 },
      { type: 'test', id: 'B_P-1', filePath: 'test/a.ts', line: 25 },
    ];

    const result = buildComponentAttribution(markers);

    expect(result.get('COMP-A')).toEqual(new Set(['A_P-1']));
    expect(result.get('COMP-B')).toEqual(new Set(['B_P-1']));
  });

  test('markers across separate files are scoped independently', () => {
    const markers: CodeMarker[] = [
      { type: 'component', id: 'COMP-A', filePath: 'src/a.ts', line: 1 },
      { type: 'impl', id: 'A-1_AC-1', filePath: 'src/a.ts', line: 5 },
      { type: 'component', id: 'COMP-A', filePath: 'src/b.ts', line: 1 },
      { type: 'impl', id: 'A-2_AC-1', filePath: 'src/b.ts', line: 5 },
    ];

    const result = buildComponentAttribution(markers);

    expect(result.get('COMP-A')).toEqual(new Set(['A-1_AC-1', 'A-2_AC-1']));
  });

  test('component with no following markers gets empty set', () => {
    const markers: CodeMarker[] = [
      { type: 'component', id: 'COMP-A', filePath: 'src/a.ts', line: 1 },
    ];

    const result = buildComponentAttribution(markers);

    expect(result.get('COMP-A')).toEqual(new Set());
  });
});

// @awa-test: DEP_P-1
// @awa-test: DEP_P-2
// @awa-test: DEP_P-4
// @awa-test: DEP-3_AC-1
// @awa-test: DEP-3_AC-2
// @awa-test: DEP-3_AC-3
// @awa-test: DEP-5_AC-1
// @awa-test: DEP-6_AC-2
describe('CodeSpecChecker — deprecated ID handling', () => {
  const deprecatedIds = new Set(['OLD-1_AC-1', 'OLD_P-1', 'OLD-Comp']);

  // @awa-test: DEP_P-1
  // @awa-test: DEP-3_AC-1, DEP-3_AC-2, DEP-3_AC-3
  test('no coverage findings for deprecated IDs', () => {
    const markers = makeMarkers([]);
    const specs = makeSpecs({
      acIds: new Set(['OLD-1_AC-1']),
      propertyIds: new Set(['OLD_P-1']),
      componentNames: new Set(['OLD-Comp']),
      allIds: new Set(['OLD-1_AC-1', 'OLD_P-1', 'OLD-Comp']),
    });

    const result = checkCodeAgainstSpec(markers, specs, makeConfig(), deprecatedIds);

    const coverageFindings = result.findings.filter(
      (f) =>
        f.code === 'uncovered-ac' ||
        f.code === 'unimplemented-ac' ||
        f.code === 'uncovered-property' ||
        f.code === 'uncovered-component',
    );
    expect(coverageFindings).toHaveLength(0);
  });

  // @awa-test: DEP_P-2
  // @awa-test: DEP-5_AC-1
  test('no orphaned-marker for deprecated IDs without --deprecated', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'OLD-1_AC-1', filePath: 'src/foo.ts', line: 5 },
      { type: 'component', id: 'OLD-Comp', filePath: 'src/foo.ts', line: 1 },
    ]);
    const specs = makeSpecs(); // IDs not in specs

    const result = checkCodeAgainstSpec(
      markers,
      specs,
      makeConfig({ deprecated: false }),
      deprecatedIds,
    );

    const orphaned = result.findings.filter((f) => f.code === 'orphaned-marker');
    expect(orphaned).toHaveLength(0);
    const depRef = result.findings.filter((f) => f.code === 'deprecated-ref');
    expect(depRef).toHaveLength(0);
  });

  // @awa-test: DEP_P-4
  // @awa-test: DEP-6_AC-2
  test('deprecated-ref warnings emitted with --deprecated flag', () => {
    const markers = makeMarkers([
      { type: 'impl', id: 'OLD-1_AC-1', filePath: 'src/foo.ts', line: 5 },
      { type: 'component', id: 'OLD-Comp', filePath: 'src/foo.ts', line: 1 },
    ]);
    const specs = makeSpecs(); // IDs not in specs

    const result = checkCodeAgainstSpec(
      markers,
      specs,
      makeConfig({ deprecated: true }),
      deprecatedIds,
    );

    const depRef = result.findings.filter((f) => f.code === 'deprecated-ref');
    expect(depRef).toHaveLength(2);
    for (const f of depRef) {
      expect(f.severity).toBe('warning');
    }
    const orphaned = result.findings.filter((f) => f.code === 'orphaned-marker');
    expect(orphaned).toHaveLength(0);
  });
});
