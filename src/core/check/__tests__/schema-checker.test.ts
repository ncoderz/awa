// @awa-component: CHK-SchemaChecker
// @awa-test: CHK-2_AC-1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { LoadedRuleSet } from '../rule-types.js';
import { checkSchemasAsync } from '../schema-checker.js';
import type { SpecFile } from '../types.js';

describe('SchemaChecker', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-schema-checker-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  function makeSpecFile(filePath: string): SpecFile {
    return {
      filePath,
      code: 'TEST',
      requirementIds: [],
      acIds: [],
      propertyIds: [],
      componentNames: [],
      crossRefs: [],
    };
  }

  function makeRuleSet(
    overrides: Partial<LoadedRuleSet['ruleFile']> & {
      'target-files': string;
      sections: LoadedRuleSet['ruleFile']['sections'];
    }
  ): LoadedRuleSet {
    return {
      ruleFile: overrides,
      sourcePath: 'test.rules.yaml',
      targetGlob: overrides['target-files'],
    };
  }

  // @awa-test: CHK-2_AC-1
  test('detects missing required section', async () => {
    const filePath = join(testDir, 'REQ-TEST.md');
    await writeFile(filePath, '# Requirements Specification\n\n## Introduction\n\nSome text.\n');

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Requirements Specification', level: 1, required: true },
        { heading: 'Introduction', level: 2, required: true },
        { heading: 'Requirements', level: 2, required: true },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    const missing = result.findings.filter((f) => f.code === 'schema-missing-section');
    expect(missing).toHaveLength(1);
    expect(missing[0]?.message).toContain('Requirements');
  });

  // @awa-test: CHK-2_AC-1
  test('detects wrong heading level', async () => {
    const filePath = join(testDir, 'DOC.md');
    await writeFile(filePath, '# Title\n\n### Introduction\n\nText here.\n');

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Title', level: 1, required: true },
        { heading: 'Introduction', level: 2, required: true },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    // The heading "Introduction" is at level 3, but rule expects level 2
    // Since buildSectionTree treats level-3 headings as children of level-1,
    // the level-2 "Introduction" won't be found as a top-level section.
    // This results in a missing-section finding.
    const issues = result.findings.filter(
      (f) => f.code === 'schema-missing-section' || f.code === 'schema-wrong-level'
    );
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });

  // @awa-test: CHK-2_AC-1
  test('detects missing contains.pattern', async () => {
    const filePath = join(testDir, 'REQ.md');
    await writeFile(
      filePath,
      '# Spec\n\n## Requirements\n\nSome text without the expected pattern.\n'
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Spec', level: 1, required: true },
        {
          heading: 'Requirements',
          level: 2,
          required: true,
          contains: [{ pattern: 'ACCEPTANCE CRITERIA', required: true }],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    const missing = result.findings.filter((f) => f.code === 'schema-missing-content');
    expect(missing).toHaveLength(1);
    expect(missing[0]?.message).toContain('ACCEPTANCE CRITERIA');
  });

  // @awa-test: CHK-2_AC-1
  test('detects missing list items with min count', async () => {
    const filePath = join(testDir, 'REQ.md');
    await writeFile(filePath, '# Spec\n\n## Tasks\n\nNo list items here.\n');

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Spec', level: 1, required: true },
        {
          heading: 'Tasks',
          level: 2,
          required: true,
          contains: [
            {
              list: {
                pattern: '- \\[[ x]\\] T-[A-Z]+-\\d+',
                min: 1,
                label: 'task checkbox',
              },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    const missing = result.findings.filter((f) => f.code === 'schema-missing-content');
    expect(missing).toHaveLength(1);
    expect(missing[0]?.message).toContain('task checkbox');
    expect(missing[0]?.message).toContain('expected at least 1');
  });

  // @awa-test: CHK-2_AC-1
  test('detects table with wrong columns', async () => {
    const filePath = join(testDir, 'TASK.md');
    await writeFile(
      filePath,
      '# Tasks\n\n## Trace Summary\n\n| Foo | Bar |\n|-----|-----|\n| 1 | 2 |\n'
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Tasks', level: 1, required: true },
        {
          heading: 'Trace Summary',
          level: 2,
          required: true,
          contains: [
            {
              table: {
                columns: ['AC', 'Task', 'Test'],
                'min-rows': 1,
              },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    const tableIssues = result.findings.filter((f) => f.code === 'schema-table-columns');
    expect(tableIssues).toHaveLength(1);
    expect(tableIssues[0]?.message).toContain('has columns [AC, Task, Test]');
  });

  // @awa-test: CHK-2_AC-1
  test('detects missing code block', async () => {
    const filePath = join(testDir, 'DESIGN.md');
    await writeFile(filePath, '# Design\n\n## Components\n\nNo code blocks here.\n');

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Design', level: 1, required: true },
        {
          heading: 'Components',
          level: 2,
          required: true,
          contains: [{ 'code-block': true as const, label: 'interface definition' }],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    const missing = result.findings.filter((f) => f.code === 'schema-missing-content');
    expect(missing).toHaveLength(1);
    expect(missing[0]?.message).toContain('interface definition');
  });

  // @awa-test: CHK-2_AC-1
  test('detects prohibited formatting', async () => {
    const filePath = join(testDir, 'REQ.md');
    await writeFile(
      filePath,
      '# Spec\n\n## Section\n\nThis has **bold text** which is prohibited.\n'
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Spec', level: 1, required: true },
        { heading: 'Section', level: 2, required: true },
      ],
      'sections-prohibited': ['**'],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    const prohibited = result.findings.filter((f) => f.code === 'schema-prohibited');
    expect(prohibited).toHaveLength(1);
    expect(prohibited[0]?.message).toContain('**');
  });

  // @awa-test: CHK-2_AC-1
  test('validates children and repeatable sections', async () => {
    const filePath = join(testDir, 'REQ.md');
    await writeFile(
      filePath,
      `# Spec

## Requirements

### TEST-1: First Requirement

Some content.

### TEST-2: Second Requirement

More content.
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Spec', level: 1, required: true },
        {
          heading: 'Requirements',
          level: 2,
          required: true,
          children: [
            {
              heading: 'TEST-\\d+: .+',
              level: 3,
              repeatable: true,
              required: true,
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    // Both children match the pattern, no issues
    const issues = result.findings.filter(
      (f) => f.code === 'schema-missing-section' || f.code === 'schema-wrong-level'
    );
    expect(issues).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('valid Markdown file produces no findings', async () => {
    const filePath = join(testDir, 'GOOD.md');
    await writeFile(
      filePath,
      `# Design Specification

## Overview

This is the overview section.

## Components

\`\`\`typescript
interface Foo {}
\`\`\`

## Change Log

- 1.0.0: Initial version
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Design Specification', level: 1, required: true },
        { heading: 'Overview', level: 2, required: true },
        {
          heading: 'Components',
          level: 2,
          required: true,
          contains: [{ 'code-block': true as const, label: 'code block' }],
        },
        { heading: 'Change Log', level: 2, required: true },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    expect(result.findings).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('skips files not matching target glob', async () => {
    const filePath = join(testDir, 'OTHER.md');
    await writeFile(filePath, '# Nothing\n');

    const ruleSet = makeRuleSet({
      'target-files': 'nonexistent/*.md',
      sections: [{ heading: 'Required', level: 1, required: true }],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    expect(result.findings).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('optional section missing produces no findings', async () => {
    const filePath = join(testDir, 'DOC.md');
    await writeFile(filePath, '# Title\n\n## Required Section\n\nContent.\n');

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Title', level: 1, required: true },
        { heading: 'Required Section', level: 2, required: true },
        { heading: 'Optional Section', level: 2, required: false },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    expect(result.findings).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('table with correct columns and enough rows passes', async () => {
    const filePath = join(testDir, 'TASK.md');
    await writeFile(
      filePath,
      `# Tasks

## Summary

| AC | Task | Test |
|----|------|------|
| X-1_AC-1 | T-X-001 | T-X-010 |
| X-1_AC-2 | T-X-002 | T-X-011 |
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Tasks', level: 1, required: true },
        {
          heading: 'Summary',
          level: 2,
          required: true,
          contains: [
            {
              table: {
                columns: ['AC', 'Task', 'Test'],
                'min-rows': 1,
              },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    expect(result.findings).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('prohibited pattern inside code block is not flagged', async () => {
    const filePath = join(testDir, 'DOC.md');
    await writeFile(filePath, '# Title\n\n## Section\n\n```\nThis has **bold** in code\n```\n');

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Title', level: 1, required: true },
        { heading: 'Section', level: 2, required: true },
      ],
      'sections-prohibited': ['**'],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    const prohibited = result.findings.filter((f) => f.code === 'schema-prohibited');
    expect(prohibited).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('list items with sufficient count passes', async () => {
    const filePath = join(testDir, 'TASK.md');
    await writeFile(
      filePath,
      `# Tasks

## Phase 1

- [ ] T-TEST-001 First task → src/foo.ts
- [ ] T-TEST-002 Second task → src/bar.ts
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Tasks', level: 1, required: true },
        {
          heading: 'Phase 1',
          level: 2,
          required: true,
          contains: [
            {
              list: {
                pattern: 'T-TEST-\\d+',
                min: 2,
                label: 'task item',
              },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    expect(result.findings).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('contains.pattern found in section passes', async () => {
    const filePath = join(testDir, 'REQ.md');
    await writeFile(
      filePath,
      '# Spec\n\n## Requirements\n\nACCEPTANCE CRITERIA\n\nSome criteria.\n'
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Spec', level: 1, required: true },
        {
          heading: 'Requirements',
          level: 2,
          required: true,
          contains: [{ pattern: 'ACCEPTANCE CRITERIA', required: true }],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    expect(result.findings).toHaveLength(0);
  });

  // --- Conditional (when) and prohibited tests ---

  // @awa-test: CHK-2_AC-1
  test('when heading-matches: rule applies when heading matches condition', async () => {
    const filePath = join(testDir, 'TASK.md');
    await writeFile(
      filePath,
      `# Tasks

## Phase 1: Config Loading [MUST]

Some text but no GOAL line.
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Tasks', level: 1, required: true },
        {
          heading: 'Phase \\d+:.*',
          level: 2,
          repeatable: true,
          contains: [
            {
              pattern: '^GOAL:',
              label: 'GOAL statement',
              when: { 'heading-matches': '\\[(MUST|SHOULD|COULD)\\]' },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    // Heading contains [MUST], condition matches, GOAL is missing → error
    const missing = result.findings.filter(
      (f: { code: string }) => f.code === 'schema-missing-content'
    );
    expect(missing).toHaveLength(1);
    expect(missing[0]?.message).toContain('GOAL statement');
  });

  // @awa-test: CHK-2_AC-1
  test('when heading-matches: rule skipped when heading does not match condition', async () => {
    const filePath = join(testDir, 'TASK.md');
    await writeFile(
      filePath,
      `# Tasks

## Phase 1: Setup

- [ ] T-X-001 Some task → src/foo.ts
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Tasks', level: 1, required: true },
        {
          heading: 'Phase \\d+:.*',
          level: 2,
          repeatable: true,
          contains: [
            {
              pattern: '^GOAL:',
              label: 'GOAL statement',
              when: { 'heading-matches': '\\[(MUST|SHOULD|COULD)\\]' },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    // Heading is "Phase 1: Setup" (no [MUST]), condition doesn't match → rule skipped
    expect(result.findings).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('prohibited pattern: error when pattern found in matching section', async () => {
    const filePath = join(testDir, 'TASK.md');
    await writeFile(
      filePath,
      `# Tasks

## Phase 1: Setup

- [ ] T-X-001 Some task → src/foo.ts
  IMPLEMENTS: X-1_AC-1
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Tasks', level: 1, required: true },
        {
          heading: 'Phase \\d+:.*',
          level: 2,
          repeatable: true,
          contains: [
            {
              pattern: 'IMPLEMENTS:',
              prohibited: true,
              label: 'IMPLEMENTS trace line (not allowed in setup phases)',
              when: { 'heading-not-matches': '\\[(MUST|SHOULD|COULD)\\]' },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    // "Setup" heading doesn't have priority marker → when-not-matches activates
    // IMPLEMENTS found → prohibited violation
    const prohibited = result.findings.filter(
      (f: { code: string }) => f.code === 'schema-prohibited'
    );
    expect(prohibited).toHaveLength(1);
    expect(prohibited[0]?.message).toContain('IMPLEMENTS trace line');
  });

  // @awa-test: CHK-2_AC-1
  test('prohibited pattern: no error when pattern not found', async () => {
    const filePath = join(testDir, 'TASK.md');
    await writeFile(
      filePath,
      `# Tasks

## Phase 1: Setup

- [ ] T-X-001 Some task → src/foo.ts
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Tasks', level: 1, required: true },
        {
          heading: 'Phase \\d+:.*',
          level: 2,
          repeatable: true,
          contains: [
            {
              pattern: 'IMPLEMENTS:',
              prohibited: true,
              label: 'IMPLEMENTS trace line',
              when: { 'heading-not-matches': '\\[(MUST|SHOULD|COULD)\\]' },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    // Setup heading, no IMPLEMENTS found → no violation
    expect(result.findings).toHaveLength(0);
  });

  // @awa-test: CHK-2_AC-1
  test('prohibited pattern skipped on requirement phases (when-not-matches does not activate)', async () => {
    const filePath = join(testDir, 'TASK.md');
    await writeFile(
      filePath,
      `# Tasks

## Phase 3: Config Loading [MUST]

GOAL: Load config
TEST CRITERIA: Can load valid TOML

- [ ] T-X-010 Implement load → src/loader.ts
  IMPLEMENTS: X-1_AC-1
`
    );

    const ruleSet = makeRuleSet({
      'target-files': `${testDir}/*.md`,
      sections: [
        { heading: 'Tasks', level: 1, required: true },
        {
          heading: 'Phase \\d+:.*',
          level: 2,
          repeatable: true,
          contains: [
            {
              pattern: 'IMPLEMENTS:',
              prohibited: true,
              label: 'IMPLEMENTS trace line',
              when: { 'heading-not-matches': '\\[(MUST|SHOULD|COULD)\\]' },
            },
          ],
        },
      ],
    });

    const result = await checkSchemasAsync([makeSpecFile(filePath)], [ruleSet]);
    // [MUST] in heading → when-not-matches condition fails → rule skipped
    // IMPLEMENTS is allowed in requirement phases
    expect(result.findings).toHaveLength(0);
  });
});
