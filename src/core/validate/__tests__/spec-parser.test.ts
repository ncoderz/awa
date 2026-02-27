// @awa-component: VAL-SpecParser
// @awa-test: VAL-2_AC-1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { parseSpecs } from '../spec-parser.js';
import type { ValidateConfig } from '../types.js';
import { DEFAULT_VALIDATE_CONFIG } from '../types.js';

describe('SpecParser', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-spec-parser-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  function makeConfig(overrides: Partial<ValidateConfig> = {}): ValidateConfig {
    return {
      ...DEFAULT_VALIDATE_CONFIG,
      specGlobs: [`${testDir}/**/*.md`],
      codeGlobs: [],
      ...overrides,
    };
  }

  // @awa-test: VAL-2_AC-1
  test('extracts requirement IDs from REQ files', async () => {
    await writeFile(
      join(testDir, 'REQ-CFG-config.md'),
      `# Requirements Specification

## Requirements

### CFG-1: Config Loading [MUST]

AS A developer, I WANT config loading, SO THAT configuration works.

ACCEPTANCE CRITERIA

- [ ] CFG-1_AC-1 [event]: WHEN config loaded THEN system SHALL parse it
- [ ] CFG-1_AC-2 [ubiquitous]: The system SHALL merge with defaults

### CFG-2: Config Validation [SHOULD]

AS A developer, I WANT validation, SO THAT errors are caught.

ACCEPTANCE CRITERIA

- [x] CFG-2_AC-1 [event]: WHEN invalid THEN system SHALL throw
`
    );

    const result = await parseSpecs(makeConfig());

    expect(result.requirementIds).toContain('CFG-1');
    expect(result.requirementIds).toContain('CFG-2');
    expect(result.acIds).toContain('CFG-1_AC-1');
    expect(result.acIds).toContain('CFG-1_AC-2');
    expect(result.acIds).toContain('CFG-2_AC-1');
  });

  // @awa-test: VAL-2_AC-1
  test('extracts subrequirement IDs', async () => {
    await writeFile(
      join(testDir, 'REQ-ENG-engine.md'),
      `# Requirements

### ENG-1: Engine [MUST]

ACCEPTANCE CRITERIA

- [ ] ENG-1_AC-1 [event]: WHEN init THEN create context

### ENG-1.1: Subsystem [SHOULD]

ACCEPTANCE CRITERIA

- [ ] ENG-1.1_AC-1 [event]: WHEN subsystem loads THEN register
`
    );

    const result = await parseSpecs(makeConfig());

    expect(result.requirementIds).toContain('ENG-1');
    expect(result.requirementIds).toContain('ENG-1.1');
    expect(result.acIds).toContain('ENG-1_AC-1');
    expect(result.acIds).toContain('ENG-1.1_AC-1');
  });

  // @awa-test: VAL-2_AC-1
  test('extracts property IDs from DESIGN files', async () => {
    await writeFile(
      join(testDir, 'DESIGN-CFG-config.md'),
      `# Design Specification

## Correctness Properties

- CFG_P-1 [CLI Override]: CLI arguments always override config file values
  VALIDATES: CFG-4_AC-1, CFG-4_AC-2

- CFG_P-2 [Default Preservation]: Missing keys preserve defaults
  VALIDATES: CFG-1_AC-2
`
    );

    const result = await parseSpecs(makeConfig());

    expect(result.propertyIds).toContain('CFG_P-1');
    expect(result.propertyIds).toContain('CFG_P-2');
  });

  // @awa-test: VAL-2_AC-1
  test('extracts component names from DESIGN files', async () => {
    await writeFile(
      join(testDir, 'DESIGN-CFG-config.md'),
      `# Design Specification

## Components and Interfaces

### CFG-ConfigLoader

Loads TOML configuration.

IMPLEMENTS: CFG-1_AC-1, CFG-1_AC-2

### CFG-Validator

Validates configuration.

IMPLEMENTS: CFG-2_AC-1
`
    );

    const result = await parseSpecs(makeConfig());

    expect(result.componentNames).toContain('CFG-ConfigLoader');
    expect(result.componentNames).toContain('CFG-Validator');
  });

  // @awa-test: VAL-2_AC-1
  test('extracts cross-references', async () => {
    await writeFile(
      join(testDir, 'DESIGN-CFG-config.md'),
      `# Design

### CFG-Loader

IMPLEMENTS: CFG-1_AC-1, CFG-1_AC-2

## Correctness Properties

- CFG_P-1 [Override]: CLI overrides
  VALIDATES: CFG-4_AC-1
`
    );

    const result = await parseSpecs(makeConfig());

    const specFile = result.specFiles[0]!;
    expect(specFile.crossRefs).toHaveLength(2);
    expect(specFile.crossRefs[0]).toMatchObject({
      type: 'implements',
      ids: ['CFG-1_AC-1', 'CFG-1_AC-2'],
    });
    expect(specFile.crossRefs[1]).toMatchObject({
      type: 'validates',
      ids: ['CFG-4_AC-1'],
    });
  });

  // @awa-test: VAL-2_AC-1
  test('extracts code prefix from filename', async () => {
    await writeFile(
      join(testDir, 'REQ-VAL-validate.md'),
      `### VAL-1: Marker Scanning [MUST]

ACCEPTANCE CRITERIA

- [ ] VAL-1_AC-1 [ubiquitous]: The system SHALL scan
`
    );

    const result = await parseSpecs(makeConfig());

    expect(result.specFiles[0]!.code).toBe('VAL');
  });

  // @awa-test: VAL-2_AC-1
  test('returns empty results for directory with no spec files', async () => {
    const result = await parseSpecs(makeConfig({ specGlobs: [`${testDir}/nonexistent/**/*.md`] }));

    expect(result.requirementIds.size).toBe(0);
    expect(result.acIds.size).toBe(0);
    expect(result.specFiles).toHaveLength(0);
  });

  // @awa-test: VAL-2_AC-1
  test('all IDs aggregated in allIds set', async () => {
    await writeFile(
      join(testDir, 'REQ-X-x.md'),
      `### X-1: Req [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(testDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );

    const result = await parseSpecs(makeConfig());

    expect(result.allIds).toContain('X-1');
    expect(result.allIds).toContain('X-1_AC-1');
    expect(result.allIds).toContain('X_P-1');
    expect(result.allIds).toContain('X-Loader');
  });
});
