// @awa-component: CHK-MatrixFixer
// @awa-test: CHK-23_AC-1
// @awa-test: CHK-23_AC-2
// @awa-test: CHK_P-11
// @awa-test: CHK_P-12

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { fixMatrices } from '../matrix-fixer.js';
import type { SpecFile, SpecParseResult } from '../types.js';

describe('MatrixFixer', () => {
  let testDir: string;
  let specDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-matrix-fixer-test-${Date.now()}`);
    specDir = join(testDir, '.awa', 'specs');
    await mkdir(specDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

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

  // --- DESIGN matrix tests ---

  describe('DESIGN matrix generation', () => {
    // @awa-test: CHK-23_AC-1
    test('generates traceability matrix from component IMPLEMENTS and property VALIDATES', async () => {
      const designPath = join(specDir, 'DESIGN-CFG-config.md');
      await writeFile(
        designPath,
        `# Design Specification

## Overview

Test design.

## Components and Interfaces

### CFG-ConfigLoader

Loads configuration.

IMPLEMENTS: CFG-1_AC-1, CFG-1_AC-2

## Correctness Properties

- CFG_P-1 [CLI Override]: CLI arguments override config
  VALIDATES: CFG-1_AC-2

## Requirements Traceability

### OLD CONTENT

- OLD → OLD

## Change Log

- 1.0.0: Initial
`
      );

      const reqPath = join(specDir, 'REQ-CFG-config.md');
      await writeFile(
        reqPath,
        `### CFG-1: Config Loading [MUST]

ACCEPTANCE CRITERIA

- [ ] CFG-1_AC-1 [event]: WHEN config loaded THEN parsed
- [ ] CFG-1_AC-2 [event]: WHEN merged THEN defaults applied
`
      );

      const specs = makeSpecs([
        {
          filePath: reqPath,
          code: 'CFG',
          requirementIds: ['CFG-1'],
          acIds: ['CFG-1_AC-1', 'CFG-1_AC-2'],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: designPath,
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: ['CFG_P-1'],
          componentNames: ['CFG-ConfigLoader'],
          crossRefs: [
            {
              type: 'implements',
              ids: ['CFG-1_AC-1', 'CFG-1_AC-2'],
              filePath: designPath,
              line: 12,
            },
          ],
          componentImplements: new Map([['CFG-ConfigLoader', ['CFG-1_AC-1', 'CFG-1_AC-2']]]),
        },
      ]);

      const result = await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);
      expect(result.filesFixed).toBe(1);

      const content = await readFile(designPath, 'utf-8');
      // Should have the REQ file heading
      expect(content).toContain('### REQ-CFG-config.md');
      // Should map ACs to component
      expect(content).toContain('- CFG-1_AC-1 → CFG-ConfigLoader');
      // Should include property association for CFG-1_AC-2
      expect(content).toContain('- CFG-1_AC-2 → CFG-ConfigLoader (CFG_P-1)');
      // Should NOT contain old content
      expect(content).not.toContain('OLD');
      // Should preserve Change Log
      expect(content).toContain('## Change Log');
      expect(content).toContain('1.0.0: Initial');
    });

    // @awa-test: CHK_P-11
    test('is idempotent — running twice produces same result', async () => {
      const designPath = join(specDir, 'DESIGN-X-x.md');
      await writeFile(
        designPath,
        `# Design Specification

## Overview

Test.

## Components and Interfaces

### X-Loader

Loads things.

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1

## Requirements Traceability

### Placeholder

- placeholder
`
      );

      const reqPath = join(specDir, 'REQ-X-x.md');
      await writeFile(reqPath, '### X-1: Feature\n\n- [ ] X-1_AC-1 [event]: test\n');

      const specs = makeSpecs([
        {
          filePath: reqPath,
          code: 'X',
          requirementIds: ['X-1'],
          acIds: ['X-1_AC-1'],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: designPath,
          code: 'X',
          requirementIds: [],
          acIds: [],
          propertyIds: ['X_P-1'],
          componentNames: ['X-Loader'],
          crossRefs: [],
          componentImplements: new Map([['X-Loader', ['X-1_AC-1']]]),
        },
      ]);

      // First fix
      await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);
      const contentAfterFirst = await readFile(designPath, 'utf-8');

      // Second fix — should return filesFixed=0 (no change)
      const result2 = await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);
      expect(result2.filesFixed).toBe(0);

      const contentAfterSecond = await readFile(designPath, 'utf-8');
      expect(contentAfterSecond).toBe(contentAfterFirst);
    });

    test('handles multiple REQ files in one DESIGN', async () => {
      const designPath = join(specDir, 'DESIGN-GEN-gen.md');
      await writeFile(
        designPath,
        `# Design Specification

## Overview

Test.

## Components and Interfaces

### GEN-FileGenerator

Generates files.

IMPLEMENTS: GEN-1_AC-1, CLI-1_AC-1

## Correctness Properties

- GEN_P-1 [Prop]: Description
  VALIDATES: GEN-1_AC-1

## Requirements Traceability

### placeholder

- old
`
      );

      const reqGen = join(specDir, 'REQ-GEN-gen.md');
      await writeFile(reqGen, '### GEN-1: Gen\n\n- [ ] GEN-1_AC-1 [event]: test\n');
      const reqCli = join(specDir, 'REQ-CLI-cli.md');
      await writeFile(reqCli, '### CLI-1: CLI\n\n- [ ] CLI-1_AC-1 [event]: test\n');

      const specs = makeSpecs([
        {
          filePath: reqGen,
          code: 'GEN',
          requirementIds: ['GEN-1'],
          acIds: ['GEN-1_AC-1'],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: reqCli,
          code: 'CLI',
          requirementIds: ['CLI-1'],
          acIds: ['CLI-1_AC-1'],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: designPath,
          code: 'GEN',
          requirementIds: [],
          acIds: [],
          propertyIds: ['GEN_P-1'],
          componentNames: ['GEN-FileGenerator'],
          crossRefs: [],
          componentImplements: new Map([['GEN-FileGenerator', ['GEN-1_AC-1', 'CLI-1_AC-1']]]),
        },
      ]);

      await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);
      const content = await readFile(designPath, 'utf-8');

      // Both REQ files should appear
      expect(content).toContain('### REQ-CLI-cli.md');
      expect(content).toContain('### REQ-GEN-gen.md');
      expect(content).toContain('- CLI-1_AC-1 → GEN-FileGenerator');
      expect(content).toContain('- GEN-1_AC-1 → GEN-FileGenerator (GEN_P-1)');
    });

    test('no-ops when no Requirements Traceability section exists', async () => {
      const designPath = join(specDir, 'DESIGN-X-x.md');
      const original = `# Design Specification

## Overview

No traceability section.

## Components and Interfaces

### X-Loader

IMPLEMENTS: X-1_AC-1
`;
      await writeFile(designPath, original);

      const specs = makeSpecs([
        {
          filePath: designPath,
          code: 'X',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: ['X-Loader'],
          crossRefs: [],
          componentImplements: new Map([['X-Loader', ['X-1_AC-1']]]),
        },
      ]);

      const result = await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);
      expect(result.filesFixed).toBe(0);

      const content = await readFile(designPath, 'utf-8');
      expect(content).toBe(original);
    });
  });

  // --- TASK matrix tests ---

  describe('TASK matrix generation', () => {
    // @awa-test: CHK-23_AC-2
    test('generates traceability matrix from task IMPLEMENTS and TESTS', async () => {
      const taskPath = join(testDir, '.awa', 'tasks', 'TASK-CFG-config-001.md');
      await mkdir(join(testDir, '.awa', 'tasks'), { recursive: true });
      await writeFile(
        taskPath,
        `# Implementation Tasks

FEATURE: Config
SOURCE: REQ-CFG-config.md, DESIGN-CFG-config.md

## Phase 1: Foundation

- [ ] T-CFG-001 Setup module → src/config/

## Phase 2: Config Loading [MUST]

GOAL: Load config
TEST CRITERIA: Can load

- [ ] T-CFG-010 [CFG-1] Implement load → src/config/loader.ts
  IMPLEMENTS: CFG-1_AC-1
- [ ] T-CFG-011 [CFG-1] Implement merge → src/config/loader.ts
  IMPLEMENTS: CFG-1_AC-2
- [ ] T-CFG-012 [P] [CFG-1] Property test → tests/config/loader.test.ts
  TESTS: CFG_P-1
- [ ] T-CFG-013 [P] [CFG-1] Test load → tests/config/loader.test.ts
  TESTS: CFG-1_AC-1

---

## Dependencies

CFG-1 → (none)

## Parallel Opportunities

Phase 2: T-CFG-012, T-CFG-013 parallel after T-CFG-011

## Requirements Traceability

### PLACEHOLDER

- old content

UNCOVERED: old
`
      );

      const reqPath = join(specDir, 'REQ-CFG-config.md');
      await writeFile(
        reqPath,
        `### CFG-1: Config [MUST]

ACCEPTANCE CRITERIA

- [ ] CFG-1_AC-1 [event]: load
- [ ] CFG-1_AC-2 [event]: merge
`
      );

      const designPath = join(specDir, 'DESIGN-CFG-config.md');
      await writeFile(
        designPath,
        `# Design

## Correctness Properties

- CFG_P-1 [CLI Override]: test
  VALIDATES: CFG-1_AC-2

## Requirements Traceability

### REQ-CFG-config.md

- stub
`
      );

      const specs = makeSpecs([
        {
          filePath: reqPath,
          code: 'CFG',
          requirementIds: ['CFG-1'],
          acIds: ['CFG-1_AC-1', 'CFG-1_AC-2'],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: designPath,
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: ['CFG_P-1'],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: taskPath,
          code: 'CFG',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: [],
          crossRefs: [
            { type: 'implements', ids: ['CFG-1_AC-1'], filePath: taskPath, line: 16 },
            { type: 'implements', ids: ['CFG-1_AC-2'], filePath: taskPath, line: 18 },
          ],
        },
      ]);

      await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);

      // Both task and design files should be fixed
      const taskContent = await readFile(taskPath, 'utf-8');
      expect(taskContent).toContain('### REQ-CFG-config.md');
      expect(taskContent).toContain('- CFG-1_AC-1 → T-CFG-010 (T-CFG-013)');
      expect(taskContent).toContain('- CFG-1_AC-2 → T-CFG-011');
      expect(taskContent).toContain('- CFG_P-1 → T-CFG-012');
      expect(taskContent).toContain('UNCOVERED: (none)');
      // Old content should be gone
      expect(taskContent).not.toContain('PLACEHOLDER');
      expect(taskContent).not.toContain('old content');
    });

    // @awa-test: CHK_P-12
    test('reports uncovered ACs and properties', async () => {
      const taskPath = join(testDir, '.awa', 'tasks', 'TASK-X-x-001.md');
      await mkdir(join(testDir, '.awa', 'tasks'), { recursive: true });
      await writeFile(
        taskPath,
        `# Implementation Tasks

FEATURE: X
SOURCE: REQ-X-x.md, DESIGN-X-x.md

## Phase 1: Setup

- [ ] T-X-001 Setup → src/

## Phase 2: Core [MUST]

GOAL: Implement
TEST CRITERIA: Tests pass

- [ ] T-X-010 [X-1] Implement → src/x.ts
  IMPLEMENTS: X-1_AC-1

---

## Dependencies

X-1 → (none)

## Parallel Opportunities

(none)

## Requirements Traceability

### old

- old

UNCOVERED: old
`
      );

      const reqPath = join(specDir, 'REQ-X-x.md');
      await writeFile(
        reqPath,
        '### X-1: Feature\n\n- [ ] X-1_AC-1 [event]: a\n- [ ] X-1_AC-2 [event]: b\n'
      );

      const designPath = join(specDir, 'DESIGN-X-x.md');
      await writeFile(
        designPath,
        `# Design

## Correctness Properties

- X_P-1 [Prop]: test
  VALIDATES: X-1_AC-1

## Requirements Traceability

### REQ-X-x.md

- stub
`
      );

      const specs = makeSpecs([
        {
          filePath: reqPath,
          code: 'X',
          requirementIds: ['X-1'],
          acIds: ['X-1_AC-1', 'X-1_AC-2'],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: designPath,
          code: 'X',
          requirementIds: [],
          acIds: [],
          propertyIds: ['X_P-1'],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: taskPath,
          code: 'X',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: [],
          crossRefs: [{ type: 'implements', ids: ['X-1_AC-1'], filePath: taskPath, line: 16 }],
        },
      ]);

      await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);
      const content = await readFile(taskPath, 'utf-8');

      // X-1_AC-2 and X_P-1 are not referenced by any task
      expect(content).toContain('UNCOVERED: X_P-1, X-1_AC-2');
    });

    // @awa-test: CHK_P-12
    test('TASK matrix is idempotent', async () => {
      const taskPath = join(testDir, '.awa', 'tasks', 'TASK-X-x-001.md');
      await mkdir(join(testDir, '.awa', 'tasks'), { recursive: true });
      await writeFile(
        taskPath,
        `# Implementation Tasks

FEATURE: X
SOURCE: REQ-X-x.md, DESIGN-X-x.md

## Phase 1: Core [MUST]

GOAL: Implement
TEST CRITERIA: Tests

- [ ] T-X-010 [X-1] Implement → src/x.ts
  IMPLEMENTS: X-1_AC-1
- [ ] T-X-011 [P] [X-1] Test → tests/x.test.ts
  TESTS: X_P-1

---

## Dependencies

X-1 → (none)

## Parallel Opportunities

(none)

## Requirements Traceability

### placeholder

- old

UNCOVERED: old
`
      );

      const reqPath = join(specDir, 'REQ-X-x.md');
      await writeFile(reqPath, '### X-1: Feature\n\n- [ ] X-1_AC-1 [event]: test\n');
      const designPath = join(specDir, 'DESIGN-X-x.md');
      await writeFile(
        designPath,
        `# Design

## Correctness Properties

- X_P-1 [Prop]: test
  VALIDATES: X-1_AC-1

## Requirements Traceability

### REQ-X-x.md

- stub
`
      );

      const specs = makeSpecs([
        {
          filePath: reqPath,
          code: 'X',
          requirementIds: ['X-1'],
          acIds: ['X-1_AC-1'],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: designPath,
          code: 'X',
          requirementIds: [],
          acIds: [],
          propertyIds: ['X_P-1'],
          componentNames: [],
          crossRefs: [],
        },
        {
          filePath: taskPath,
          code: 'X',
          requirementIds: [],
          acIds: [],
          propertyIds: [],
          componentNames: [],
          crossRefs: [],
        },
      ]);

      await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);
      const first = await readFile(taskPath, 'utf-8');

      const result2 = await fixMatrices(specs, ['IMPLEMENTS:', 'VALIDATES:']);
      expect(result2.filesFixed).toBe(0);

      const second = await readFile(taskPath, 'utf-8');
      expect(second).toBe(first);
    });
  });
});
