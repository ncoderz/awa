// @awa-component: VAL-RuleLoader
// @awa-test: VAL-RuleLoader

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { loadRules, matchesTargetGlob, RuleValidationError } from '../rule-loader.js';

describe('RuleLoader', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-rule-loader-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // @awa-test: VAL-RuleLoader
  test('loads a valid rule file', async () => {
    await writeFile(
      join(testDir, 'REQ.rules.yaml'),
      `target-files: ".awa/specs/REQ-*.md"

sections:
  - heading: "Requirements Specification"
    level: 1
    required: true

  - heading: "Introduction"
    level: 2
    required: true

  - heading: "Requirements"
    level: 2
    required: true
    children:
      - heading: ".+"
        level: 3
        repeatable: true
        contains:
          - pattern: "ACCEPTANCE CRITERIA"
            required: true
          - list:
              pattern: "- \\\\[[ x]\\\\] [A-Z]+-\\\\d+_AC-\\\\d+"
              min: 1
              label: "acceptance criterion"

  - heading: "Assumptions"
    level: 2
    required: false
`
    );

    const rules = await loadRules(testDir);
    expect(rules).toHaveLength(1);

    const rule = rules[0]!;
    expect(rule.targetGlob).toBe('.awa/specs/REQ-*.md');
    expect(rule.ruleFile.sections).toHaveLength(4);

    const reqSection = rule.ruleFile.sections[2]!;
    expect(reqSection.heading).toBe('Requirements');
    expect(reqSection.required).toBe(true);
    expect(reqSection.children).toHaveLength(1);

    const child = reqSection.children![0]!;
    expect(child.repeatable).toBe(true);
    expect(child.contains).toHaveLength(2);
  });

  // @awa-test: VAL-RuleLoader
  test('loads multiple rule files from directory', async () => {
    await writeFile(
      join(testDir, 'REQ.rules.yaml'),
      `target-files: ".awa/specs/REQ-*.md"
sections:
  - heading: "Requirements"
    level: 1
    required: true
`
    );
    await writeFile(
      join(testDir, 'DESIGN.rules.yaml'),
      `target-files: ".awa/specs/DESIGN-*.md"
sections:
  - heading: "Design"
    level: 1
    required: true
`
    );

    const rules = await loadRules(testDir);
    expect(rules).toHaveLength(2);
    const globs = rules.map((r) => r.targetGlob).sort();
    expect(globs).toEqual(['.awa/specs/DESIGN-*.md', '.awa/specs/REQ-*.md']);
  });

  // @awa-test: VAL-RuleLoader
  test('returns empty array when no rule files found', async () => {
    const rules = await loadRules(testDir);
    expect(rules).toHaveLength(0);
  });

  // @awa-test: VAL-RuleLoader
  test('rejects rule file missing target-files', async () => {
    await writeFile(
      join(testDir, 'bad.rules.yaml'),
      `sections:
  - heading: "Title"
    level: 1
`
    );

    await expect(loadRules(testDir)).rejects.toThrow(RuleValidationError);
    await expect(loadRules(testDir)).rejects.toThrow("Missing or empty 'target-files'");
  });

  // @awa-test: VAL-RuleLoader
  test('rejects rule file missing sections', async () => {
    await writeFile(
      join(testDir, 'bad.rules.yaml'),
      `target-files: "*.md"
`
    );

    await expect(loadRules(testDir)).rejects.toThrow(RuleValidationError);
    await expect(loadRules(testDir)).rejects.toThrow("Missing or empty 'sections'");
  });

  // @awa-test: VAL-RuleLoader
  test('rejects section with invalid heading level', async () => {
    await writeFile(
      join(testDir, 'bad.rules.yaml'),
      `target-files: "*.md"
sections:
  - heading: "Title"
    level: 7
`
    );

    await expect(loadRules(testDir)).rejects.toThrow(RuleValidationError);
    await expect(loadRules(testDir)).rejects.toThrow('level must be 1-6');
  });

  // @awa-test: VAL-RuleLoader
  test('rejects invalid regex in pattern field', async () => {
    await writeFile(
      join(testDir, 'bad.rules.yaml'),
      `target-files: "*.md"
sections:
  - heading: "Title"
    level: 1
    contains:
      - pattern: "[invalid("
`
    );

    await expect(loadRules(testDir)).rejects.toThrow(RuleValidationError);
    await expect(loadRules(testDir)).rejects.toThrow('Invalid regex');
  });

  // @awa-test: VAL-RuleLoader
  test('loads rule with table contains', async () => {
    await writeFile(
      join(testDir, 'table.rules.yaml'),
      `target-files: ".awa/tasks/TASK-*.md"
sections:
  - heading: "Trace Summary"
    level: 2
    required: true
    contains:
      - table:
          heading: "AC"
          columns: ["AC", "Task", "Test"]
          min-rows: 1
`
    );

    const rules = await loadRules(testDir);
    const section = rules[0]!.ruleFile.sections[0]!;
    expect(section.contains).toHaveLength(1);

    const tableRule = section.contains![0]!;
    expect('table' in tableRule).toBe(true);
    if ('table' in tableRule) {
      expect(tableRule.table.columns).toEqual(['AC', 'Task', 'Test']);
      expect(tableRule.table['min-rows']).toBe(1);
    }
  });

  // @awa-test: VAL-RuleLoader
  test('loads rule with code-block contains', async () => {
    await writeFile(
      join(testDir, 'design.rules.yaml'),
      `target-files: ".awa/specs/DESIGN-*.md"
sections:
  - heading: "Components"
    level: 2
    required: true
    contains:
      - code-block: true
        label: "interface definition"
`
    );

    const rules = await loadRules(testDir);
    const section = rules[0]!.ruleFile.sections[0]!;
    const codeRule = section.contains![0]!;
    expect('code-block' in codeRule).toBe(true);
  });

  // @awa-test: VAL-RuleLoader
  test('loads sections-prohibited', async () => {
    await writeFile(
      join(testDir, 'req.rules.yaml'),
      `target-files: ".awa/specs/REQ-*.md"
sections:
  - heading: "Title"
    level: 1
    required: true
sections-prohibited:
  - "**"
  - "*"
`
    );

    const rules = await loadRules(testDir);
    expect(rules[0]!.ruleFile['sections-prohibited']).toEqual(['**', '*']);
  });

  describe('matchesTargetGlob', () => {
    // @awa-test: VAL-RuleLoader
    test('matches simple glob patterns', () => {
      expect(matchesTargetGlob('.awa/specs/REQ-VAL-validate.md', '.awa/specs/REQ-*.md')).toBe(true);
      expect(matchesTargetGlob('.awa/specs/DESIGN-VAL-validate.md', '.awa/specs/REQ-*.md')).toBe(
        false
      );
    });

    // @awa-test: VAL-RuleLoader
    test('matches recursive glob patterns', () => {
      expect(matchesTargetGlob('.awa/tasks/TASK-VAL-001.md', '.awa/tasks/TASK-*.md')).toBe(true);
      expect(matchesTargetGlob('other/TASK-X.md', '.awa/tasks/TASK-*.md')).toBe(false);
    });
  });

  // @awa-test: VAL-RuleLoader
  test('loads rule with when condition and prohibited flag', async () => {
    await writeFile(
      join(testDir, 'task.rules.yaml'),
      `target-files: ".awa/tasks/TASK-*.md"
sections:
  - heading: "Phase \\\\d+:.*"
    level: 2
    repeatable: true
    contains:
      - pattern: "^GOAL:"
        label: "GOAL statement"
        when:
          heading-matches: "\\\\[(MUST|SHOULD|COULD)\\\\]"
      - pattern: "IMPLEMENTS:"
        prohibited: true
        label: "IMPLEMENTS trace"
        when:
          heading-not-matches: "\\\\[(MUST|SHOULD|COULD)\\\\]"
`
    );

    const rules = await loadRules(testDir);
    expect(rules).toHaveLength(1);

    const section = rules[0]!.ruleFile.sections[0]!;
    expect(section.contains).toHaveLength(2);

    const goalRule = section.contains![0]!;
    expect('pattern' in goalRule).toBe(true);
    if ('pattern' in goalRule) {
      expect(goalRule.when).toEqual({ 'heading-matches': '\\[(MUST|SHOULD|COULD)\\]' });
    }

    const implRule = section.contains![1]!;
    if ('pattern' in implRule) {
      expect(implRule.prohibited).toBe(true);
      expect(implRule.when).toEqual({ 'heading-not-matches': '\\[(MUST|SHOULD|COULD)\\]' });
    }
  });

  // @awa-test: VAL-RuleLoader
  test('rejects when condition with invalid regex', async () => {
    await writeFile(
      join(testDir, 'bad-when.rules.yaml'),
      `target-files: "*.md"
sections:
  - heading: "Title"
    level: 1
    contains:
      - pattern: "test"
        when:
          heading-matches: "[invalid("
`
    );

    await expect(loadRules(testDir)).rejects.toThrow(RuleValidationError);
    await expect(loadRules(testDir)).rejects.toThrow('Invalid regex');
  });

  // @awa-test: VAL-RuleLoader
  test('rejects when condition without heading-matches or heading-not-matches', async () => {
    await writeFile(
      join(testDir, 'bad-when.rules.yaml'),
      `target-files: "*.md"
sections:
  - heading: "Title"
    level: 1
    contains:
      - pattern: "test"
        when:
          foo: "bar"
`
    );

    await expect(loadRules(testDir)).rejects.toThrow(RuleValidationError);
    await expect(loadRules(testDir)).rejects.toThrow("must have 'heading-matches'");
  });
});
