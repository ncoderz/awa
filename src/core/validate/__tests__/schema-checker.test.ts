// @awa-component: VAL-SchemaChecker
// @awa-test: VAL-SchemaChecker

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

  // @awa-test: VAL-SchemaChecker
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
    expect(missing[0]!.message).toContain('Requirements');
  });

  // @awa-test: VAL-SchemaChecker
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

  // @awa-test: VAL-SchemaChecker
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
    expect(missing[0]!.message).toContain('ACCEPTANCE CRITERIA');
  });

  // @awa-test: VAL-SchemaChecker
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
    expect(missing[0]!.message).toContain('task checkbox');
    expect(missing[0]!.message).toContain('expected at least 1');
  });

  // @awa-test: VAL-SchemaChecker
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
    expect(tableIssues[0]!.message).toContain('expected [AC, Task, Test]');
  });

  // @awa-test: VAL-SchemaChecker
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
    expect(missing[0]!.message).toContain('interface definition');
  });

  // @awa-test: VAL-SchemaChecker
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
    expect(prohibited[0]!.message).toContain('**');
  });

  // @awa-test: VAL-SchemaChecker
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

  // @awa-test: VAL-SchemaChecker
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

  // @awa-test: VAL-SchemaChecker
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

  // @awa-test: VAL-SchemaChecker
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

  // @awa-test: VAL-SchemaChecker
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

  // @awa-test: VAL-SchemaChecker
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

  // @awa-test: VAL-SchemaChecker
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

  // @awa-test: VAL-SchemaChecker
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
});
