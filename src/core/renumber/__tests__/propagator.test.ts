// @awa-test: RENUM_P-4, RENUM_P-5
// @awa-test: RENUM-5_AC-1, RENUM-5_AC-2, RENUM-5_AC-3
// @awa-test: RENUM-6_AC-1, RENUM-6_AC-2

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  CheckConfig,
  MarkerScanResult,
  SpecFile,
  SpecParseResult,
} from '../../check/types.js';
import { DEFAULT_CHECK_CONFIG } from '../../check/types.js';
import { propagate } from '../propagator.js';
import type { RenumberMap } from '../types.js';

// --- Helpers ---

let testDir: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `renum-prop-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

function makeMap(code: string, entries: [string, string][]): RenumberMap {
  return { code, entries: new Map(entries) };
}

function makeSpecFile(filePath: string, code: string): SpecFile {
  return {
    filePath,
    code,
    requirementIds: [],
    acIds: [],
    propertyIds: [],
    componentNames: [],
    crossRefs: [],
  };
}

function makeSpecs(specFiles: SpecFile[]): SpecParseResult {
  return {
    requirementIds: new Set(),
    acIds: new Set(),
    propertyIds: new Set(),
    componentNames: new Set(),
    allIds: new Set(),
    specFiles,
    idLocations: new Map(),
  };
}

function makeMarkers(markers: { id: string; filePath: string }[]): MarkerScanResult {
  return {
    markers: markers.map((m) => ({
      type: 'impl' as const,
      id: m.id,
      filePath: m.filePath,
      line: 1,
    })),
    findings: [],
  };
}

function makeConfig(): CheckConfig {
  // Use defaults but with empty extra globs to avoid scanning the real filesystem
  return {
    ...DEFAULT_CHECK_CONFIG,
    extraSpecGlobs: [],
    extraSpecIgnore: [],
  };
}

// --- Unit Tests ---

describe('propagate', () => {
  it('replaces IDs in spec files', async () => {
    const specPath = join(testDir, 'REQ-FOO-feature.md');
    await writeFile(specPath, '### FOO-3: Title\n- FOO-3_AC-1 [event]: criteria\n', 'utf-8');

    const map = makeMap('FOO', [
      ['FOO-3', 'FOO-1'],
      ['FOO-3_AC-1', 'FOO-1_AC-1'],
    ]);
    const specs = makeSpecs([makeSpecFile(specPath, 'FOO')]);
    const markers = makeMarkers([]);

    const result = await propagate(map, specs, markers, makeConfig(), false);

    expect(result.totalReplacements).toBeGreaterThan(0);
    const content = await readFile(specPath, 'utf-8');
    expect(content).toContain('FOO-1');
    expect(content).toContain('FOO-1_AC-1');
    expect(content).not.toContain('FOO-3');
  });

  it('replaces IDs in code files with markers', async () => {
    const codePath = join(testDir, 'test.ts');
    await writeFile(
      codePath,
      `// @awa-${'impl'}: FOO-3_AC-1\n// @awa-${'test'}: FOO_P-2\n`,
      'utf-8',
    );

    const map = makeMap('FOO', [
      ['FOO-3_AC-1', 'FOO-1_AC-1'],
      ['FOO_P-2', 'FOO_P-1'],
    ]);
    const specs = makeSpecs([]);
    const markers = makeMarkers([
      { id: 'FOO-3_AC-1', filePath: codePath },
      { id: 'FOO_P-2', filePath: codePath },
    ]);

    const result = await propagate(map, specs, markers, makeConfig(), false);

    expect(result.totalReplacements).toBeGreaterThan(0);
    const content = await readFile(codePath, 'utf-8');
    expect(content).toContain('FOO-1_AC-1');
    expect(content).toContain('FOO_P-1');
  });

  it('handles cross-reference lines (IMPLEMENTS, VALIDATES)', async () => {
    const specPath = join(testDir, 'DESIGN-FOO-feature.md');
    await writeFile(specPath, 'IMPLEMENTS: FOO-3_AC-1, FOO-3_AC-2\nVALIDATES: FOO-3\n', 'utf-8');

    const map = makeMap('FOO', [
      ['FOO-3', 'FOO-1'],
      ['FOO-3_AC-1', 'FOO-1_AC-1'],
      ['FOO-3_AC-2', 'FOO-1_AC-2'],
    ]);
    const specs = makeSpecs([makeSpecFile(specPath, 'FOO')]);
    const markers = makeMarkers([]);

    await propagate(map, specs, markers, makeConfig(), false);

    const content = await readFile(specPath, 'utf-8');
    expect(content).toContain('FOO-1_AC-1');
    expect(content).toContain('FOO-1_AC-2');
    expect(content).toContain('VALIDATES: FOO-1');
  });

  it('does not write files in dry-run mode', async () => {
    const specPath = join(testDir, 'REQ-FOO-feature.md');
    const original = '### FOO-3: Title\n';
    await writeFile(specPath, original, 'utf-8');

    const map = makeMap('FOO', [['FOO-3', 'FOO-1']]);
    const specs = makeSpecs([makeSpecFile(specPath, 'FOO')]);
    const markers = makeMarkers([]);

    const result = await propagate(map, specs, markers, makeConfig(), true);

    expect(result.totalReplacements).toBeGreaterThan(0);
    const content = await readFile(specPath, 'utf-8');
    expect(content).toBe(original); // unchanged
  });

  it('does not modify IDs from other feature codes', async () => {
    const specPath = join(testDir, 'REQ-FOO-feature.md');
    await writeFile(specPath, '### FOO-3: Title\nDEPENDS ON: BAR-1\n', 'utf-8');

    const map = makeMap('FOO', [['FOO-3', 'FOO-1']]);
    const specs = makeSpecs([makeSpecFile(specPath, 'FOO')]);
    const markers = makeMarkers([]);

    await propagate(map, specs, markers, makeConfig(), false);

    const content = await readFile(specPath, 'utf-8');
    expect(content).toContain('FOO-1');
    expect(content).toContain('BAR-1'); // unchanged
  });

  it('handles empty map gracefully', async () => {
    const map = makeMap('FOO', []);
    const specs = makeSpecs([]);
    const markers = makeMarkers([]);

    const result = await propagate(map, specs, markers, makeConfig(), false);

    expect(result.affectedFiles).toHaveLength(0);
    expect(result.totalReplacements).toBe(0);
  });

  it('replaces IDs in spec files belonging to other feature codes', async () => {
    // A DESIGN file for another feature (BAR) that references FOO IDs
    // in a traceability matrix — not via formal crossRefs
    const otherSpecPath = join(testDir, 'DESIGN-BAR-other.md');
    await writeFile(
      otherSpecPath,
      '| Component | IMPLEMENTS |\n| --- | --- |\n| BAR-Engine | FOO-3_AC-1 |\n',
      'utf-8',
    );

    const map = makeMap('FOO', [['FOO-3_AC-1', 'FOO-1_AC-1']]);
    // The BAR spec file has no crossRefs to FOO — it just has inline text
    const specs = makeSpecs([makeSpecFile(otherSpecPath, 'BAR')]);
    const markers = makeMarkers([]);

    const result = await propagate(map, specs, markers, makeConfig(), false);

    expect(result.totalReplacements).toBe(1);
    const content = await readFile(otherSpecPath, 'utf-8');
    expect(content).toContain('FOO-1_AC-1');
    expect(content).not.toContain('FOO-3_AC-1');
  });

  // @awa-test: RENUM-5_AC-1
  it('replaces IDs in ARCHITECTURE.md, FEAT, EXAMPLE, TASK, PLAN, and ALIGN files', async () => {
    const archPath = join(testDir, 'ARCHITECTURE.md');
    const featPath = join(testDir, 'FEAT-FOO-feature.md');
    const examplePath = join(testDir, 'EXAMPLE-FOO-feature-001.md');
    const taskPath = join(testDir, 'TASK-FOO-feature-001.md');
    const planPath = join(testDir, 'PLAN-001-some-plan.md');
    const alignPath = join(testDir, 'ALIGN-FOO-WITH-BAR-001.md');

    await Promise.all([
      writeFile(archPath, '| FOO | feature | FOO-3 scope |\n', 'utf-8'),
      writeFile(featPath, 'See FOO-3 for context.\n', 'utf-8'),
      writeFile(examplePath, 'Example: FOO-3_AC-1 scenario\n', 'utf-8'),
      writeFile(taskPath, '- [ ] Implement FOO-3_AC-1\n', 'utf-8'),
      writeFile(planPath, 'Covers FOO-3 and FOO-3_AC-1\n', 'utf-8'),
      writeFile(alignPath, 'FOO-3 alignment\n', 'utf-8'),
    ]);

    const map = makeMap('FOO', [
      ['FOO-3', 'FOO-1'],
      ['FOO-3_AC-1', 'FOO-1_AC-1'],
    ]);
    const specs = makeSpecs([
      makeSpecFile(archPath, ''),
      makeSpecFile(featPath, 'FOO'),
      makeSpecFile(examplePath, 'FOO'),
      makeSpecFile(taskPath, 'FOO'),
      makeSpecFile(planPath, ''),
      makeSpecFile(alignPath, ''),
    ]);
    const markers = makeMarkers([]);

    const result = await propagate(map, specs, markers, makeConfig(), false);

    expect(result.affectedFiles).toHaveLength(6);

    const [arch, feat, example, task, plan, align] = await Promise.all([
      readFile(archPath, 'utf-8'),
      readFile(featPath, 'utf-8'),
      readFile(examplePath, 'utf-8'),
      readFile(taskPath, 'utf-8'),
      readFile(planPath, 'utf-8'),
      readFile(alignPath, 'utf-8'),
    ]);

    expect(arch).toContain('FOO-1');
    expect(feat).toContain('FOO-1');
    expect(example).toContain('FOO-1_AC-1');
    expect(task).toContain('FOO-1_AC-1');
    expect(plan).toContain('FOO-1');
    expect(align).toContain('FOO-1');
  });

  // @awa-test: RENUM-5_AC-1
  it('replaces IDs in API (.tsp) files', async () => {
    const apiPath = join(testDir, 'API-FOO-api.tsp');
    await writeFile(apiPath, '// FOO-3_AC-1 mapping\nmodel FooRequest {}\n', 'utf-8');

    const map = makeMap('FOO', [['FOO-3_AC-1', 'FOO-1_AC-1']]);
    const specs = makeSpecs([makeSpecFile(apiPath, 'FOO')]);
    const markers = makeMarkers([]);

    const result = await propagate(map, specs, markers, makeConfig(), false);

    expect(result.totalReplacements).toBe(1);
    const content = await readFile(apiPath, 'utf-8');
    expect(content).toContain('FOO-1_AC-1');
  });

  // @awa-test: RENUM-5_AC-2
  it('replaces IDs in files with @awa-component markers', async () => {
    const codePath = join(testDir, 'engine.ts');
    await writeFile(
      codePath,
      `// @awa-${'component'}: FOO-Engine\n// @awa-${'impl'}: FOO-3_AC-1\nfunction run() {}\n`,
      'utf-8',
    );

    const map = makeMap('FOO', [['FOO-3_AC-1', 'FOO-1_AC-1']]);
    const specs = makeSpecs([]);
    const markers = makeMarkers([
      { id: 'FOO-Engine', filePath: codePath },
      { id: 'FOO-3_AC-1', filePath: codePath },
    ]);

    const result = await propagate(map, specs, markers, makeConfig(), false);

    expect(result.totalReplacements).toBeGreaterThan(0);
    const content = await readFile(codePath, 'utf-8');
    expect(content).toContain('FOO-1_AC-1');
    // Component name should not be changed (it's not in the map)
    expect(content).toContain('FOO-Engine');
  });

  // @awa-test: RENUM-5_AC-3
  it('replaces IDs in files matched by extraSpecGlobs', async () => {
    // Create a custom file that wouldn't be matched by standard spec patterns
    const extraDir = join(testDir, 'extra');
    await mkdir(extraDir, { recursive: true });

    const customPath = join(extraDir, 'custom-notes.md');
    await writeFile(customPath, '# Notes\nReference to FOO-3 and FOO-3_AC-1 here.\n', 'utf-8');

    const map = makeMap('FOO', [
      ['FOO-3', 'FOO-1'],
      ['FOO-3_AC-1', 'FOO-1_AC-1'],
    ]);
    const specs = makeSpecs([]); // Not in standard specs
    const markers = makeMarkers([]);

    // Configure extraSpecGlobs to find the custom file (use glob relative to testDir)
    const config: CheckConfig = {
      ...DEFAULT_CHECK_CONFIG,
      extraSpecGlobs: [`${testDir}/extra/**/*.md`],
      extraSpecIgnore: [],
    };

    const result = await propagate(map, specs, markers, config, false);

    expect(result.totalReplacements).toBe(2);
    expect(result.affectedFiles.map((f) => f.filePath)).toContain(customPath);
    const content = await readFile(customPath, 'utf-8');
    expect(content).toContain('FOO-1');
    expect(content).toContain('FOO-1_AC-1');
    expect(content).not.toContain('FOO-3');
  });

  // @awa-test: RENUM-5_AC-3
  it('excludes files matching extraSpecIgnore from extra globs', async () => {
    const extraDir = join(testDir, 'extra');
    const ignoredDir = join(testDir, 'extra', 'ignored');
    await mkdir(extraDir, { recursive: true });
    await mkdir(ignoredDir, { recursive: true });

    const customPath = join(extraDir, 'custom-notes.md');
    const ignoredPath = join(ignoredDir, 'schema.md');
    await writeFile(customPath, 'Reference to FOO-3 here.\n', 'utf-8');
    await writeFile(ignoredPath, 'Reference to FOO-3 here.\n', 'utf-8');

    const map = makeMap('FOO', [['FOO-3', 'FOO-1']]);
    const specs = makeSpecs([]);
    const markers = makeMarkers([]);

    // Configure to scan extra but ignore the ignored subdir
    const config: CheckConfig = {
      ...DEFAULT_CHECK_CONFIG,
      extraSpecGlobs: [`${testDir}/extra/**/*.md`],
      extraSpecIgnore: [`${testDir}/extra/ignored/**`],
    };

    const result = await propagate(map, specs, markers, config, false);

    // Only customPath should be updated, not ignoredPath
    expect(result.affectedFiles.map((f) => f.filePath)).toContain(customPath);
    expect(result.affectedFiles.map((f) => f.filePath)).not.toContain(ignoredPath);

    const customContent = await readFile(customPath, 'utf-8');
    expect(customContent).toContain('FOO-1');

    const ignoredContent = await readFile(ignoredPath, 'utf-8');
    expect(ignoredContent).toContain('FOO-3'); // unchanged
  });
});

// --- Property-Based Tests ---

describe('Propagator Properties', () => {
  // @awa-test: RENUM_P-4
  it('P-4: two-pass replacement never produces intermediate duplicate IDs (swap scenario)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        async (numA, numB) => {
          // Skip when A === B (no swap)
          if (numA === numB) return;

          const code = 'SWP';
          const idA = `${code}-${numA}`;
          const idB = `${code}-${numB}`;

          // Swap A↔B
          const map = makeMap(code, [
            [idA, idB],
            [idB, idA],
          ]);

          const specPath = join(testDir, `REQ-${code}-swap-${numA}-${numB}.md`);
          await writeFile(
            specPath,
            `### ${idA}: First\n- ${idA}_AC-1 [event]: criteria\n### ${idB}: Second\n`,
            'utf-8',
          );

          const specs = makeSpecs([makeSpecFile(specPath, code)]);
          const markers = makeMarkers([]);

          await propagate(map, specs, markers, makeConfig(), false);

          const content = await readFile(specPath, 'utf-8');
          // After swap: idA positions should have idB and vice versa
          expect(content).toContain(`### ${idB}: First`);
          expect(content).toContain(`### ${idA}: Second`);
        },
      ),
      { numRuns: 100 },
    );
  });

  // @awa-test: RENUM_P-5
  it('P-5: only IDs matching target prefix are modified, other prefixes unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('AAA', 'BBB', 'CCC'),
        fc.constantFrom('XXX', 'YYY', 'ZZZ'),
        async (targetCode, otherCode) => {
          const targetId = `${targetCode}-5`;
          const otherId = `${otherCode}-5`;

          const map = makeMap(targetCode, [[targetId, `${targetCode}-1`]]);

          const specPath = join(testDir, `REQ-${targetCode}-iso-${targetCode}-${otherCode}.md`);
          await writeFile(specPath, `### ${targetId}: Target\nDEPENDS ON: ${otherId}\n`, 'utf-8');

          const specs = makeSpecs([makeSpecFile(specPath, targetCode)]);
          const markers = makeMarkers([]);

          await propagate(map, specs, markers, makeConfig(), false);

          const content = await readFile(specPath, 'utf-8');
          // Target code ID replaced
          expect(content).toContain(`${targetCode}-1`);
          // Other code ID untouched
          expect(content).toContain(otherId);
        },
      ),
      { numRuns: 100 },
    );
  });
});
