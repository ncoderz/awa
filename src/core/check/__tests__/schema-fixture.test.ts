// @awa-test: CHK-2_AC-1
// Tests that validate real .schema.yaml schemas against fixture documents.

import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { loadRules } from '../rule-loader.js';
import type { LoadedRuleSet } from '../rule-types.js';
import { checkSchemasAsync } from '../schema-checker.js';
import type { SpecFile } from '../types.js';

const SCHEMAS_DIR = resolve(import.meta.dirname, '../../../../templates/awa/.awa/.agent/schemas');
const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures');

function makeSpecFile(filePath: string, relPath: string): SpecFile {
  return {
    filePath,
    code: relPath.match(/(?:REQ|DESIGN|TASK|FEAT|EXAMPLES|ALIGN)-([A-Z]+)/)?.[1] ?? 'TEST',
    requirementIds: [],
    acIds: [],
    propertyIds: [],
    componentNames: [],
    crossRefs: [],
  };
}

/**
 * Remap a rule set's target glob to use just the filename pattern
 * so it matches absolute fixture paths via suffix matching.
 */
function remapRuleSet(ruleSet: LoadedRuleSet): LoadedRuleSet {
  // Extract just the filename glob from the target path
  const targetParts = ruleSet.targetGlob.split('/');
  const fileGlob = targetParts.at(-1) ?? '*';
  return {
    ...ruleSet,
    targetGlob: fileGlob,
    ruleFile: { ...ruleSet.ruleFile, 'target-files': fileGlob },
  };
}

async function loadFixtureFiles(dir: string): Promise<{ filePath: string; relName: string }[]> {
  const entries = await readdir(dir);
  return entries
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ filePath: join(dir, f), relName: f }));
}

describe('Schema fixture validation', () => {
  let ruleSets: LoadedRuleSet[];

  beforeAll(async () => {
    ruleSets = await loadRules(SCHEMAS_DIR);
  });

  test('loads all schema.yaml files', () => {
    expect(ruleSets.length).toBeGreaterThanOrEqual(6);
  });

  // ── Description & Example Fields ─────────────────────────────────

  test('TASK rules include description and example', () => {
    const taskRules = ruleSets.find((rs) => rs.targetGlob.includes('TASK-'));
    expect(taskRules).toBeDefined();
    if (!taskRules) return;

    // Top-level description
    expect(taskRules.ruleFile.description).toBeDefined();
    expect(taskRules.ruleFile.description?.length).toBeGreaterThan(20);

    // Example block
    expect(taskRules.ruleFile.example).toBeDefined();
    expect(taskRules.ruleFile.example).toContain('# Implementation Tasks');
    expect(taskRules.ruleFile.example).toContain('FEATURE:');
    expect(taskRules.ruleFile.example).toContain('T-CFG-');

    // Section-level descriptions
    const phaseSection = taskRules.ruleFile.sections.find((s) => s.heading.includes('Phase'));
    expect(phaseSection?.description).toBeDefined();

    // Contains-level descriptions
    const patternWithDesc = phaseSection?.contains?.find(
      (c) => 'description' in c && c.description
    );
    expect(patternWithDesc).toBeDefined();
  });

  // ── Conforming Fixtures ──────────────────────────────────────────

  describe('conforming fixtures produce zero findings', () => {
    const conformDir = join(FIXTURES_DIR, 'conforming');

    test('TASK fixture passes TASK rules', async () => {
      const files = await loadFixtureFiles(conformDir);
      const taskFile = files.find((f) => f.relName.startsWith('TASK-'));
      expect(taskFile).toBeDefined();
      if (!taskFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(taskFile.filePath, taskFile.relName)],
        remapped
      );
      expect(result.findings).toHaveLength(0);
    });

    test('REQ fixture passes REQ rules', async () => {
      const files = await loadFixtureFiles(conformDir);
      const reqFile = files.find((f) => f.relName.startsWith('REQ-'));
      expect(reqFile).toBeDefined();
      if (!reqFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(reqFile.filePath, reqFile.relName)],
        remapped
      );
      expect(result.findings).toHaveLength(0);
    });

    test('DESIGN fixture passes DESIGN rules', async () => {
      const files = await loadFixtureFiles(conformDir);
      const designFile = files.find((f) => f.relName.startsWith('DESIGN-'));
      expect(designFile).toBeDefined();
      if (!designFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(designFile.filePath, designFile.relName)],
        remapped
      );
      expect(result.findings).toHaveLength(0);
    });

    test('FEAT fixture passes FEAT rules', async () => {
      const files = await loadFixtureFiles(conformDir);
      const featFile = files.find((f) => f.relName.startsWith('FEAT-'));
      expect(featFile).toBeDefined();
      if (!featFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(featFile.filePath, featFile.relName)],
        remapped
      );
      expect(result.findings).toHaveLength(0);
    });

    test('ARCHITECTURE fixture passes ARCHITECTURE rules', async () => {
      const files = await loadFixtureFiles(conformDir);
      const archFile = files.find((f) => f.relName === 'ARCHITECTURE.md');
      expect(archFile).toBeDefined();
      if (!archFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(archFile.filePath, archFile.relName)],
        remapped
      );
      expect(result.findings).toHaveLength(0);
    });

    test('EXAMPLES fixture passes EXAMPLES rules', async () => {
      const files = await loadFixtureFiles(conformDir);
      const exFile = files.find((f) => f.relName.startsWith('EXAMPLES-'));
      expect(exFile).toBeDefined();
      if (!exFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(exFile.filePath, exFile.relName)],
        remapped
      );
      expect(result.findings).toHaveLength(0);
    });

    test('ALIGN fixture passes ALIGN_REPORT rules', async () => {
      const files = await loadFixtureFiles(conformDir);
      const alignFile = files.find((f) => f.relName.startsWith('ALIGN-'));
      expect(alignFile).toBeDefined();
      if (!alignFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(alignFile.filePath, alignFile.relName)],
        remapped
      );
      expect(result.findings).toHaveLength(0);
    });
  });

  // ── Non-Conforming Fixtures ──────────────────────────────────────

  describe('non-conforming fixtures produce expected findings', () => {
    const nonConformDir = join(FIXTURES_DIR, 'non-conforming');

    test('TASK fixture: IMPLEMENTS prohibited on setup phase + missing SOURCE', async () => {
      const files = await loadFixtureFiles(nonConformDir);
      const taskFile = files.find((f) => f.relName.startsWith('TASK-'));
      expect(taskFile).toBeDefined();
      if (!taskFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(taskFile.filePath, taskFile.relName)],
        remapped
      );

      const codes = result.findings.map((f) => f.code);
      // Should have prohibited violation for IMPLEMENTS on setup phase
      expect(codes).toContain('schema-prohibited');
      // Should be missing Parallel Opportunities section
      expect(codes).toContain('schema-missing-section');
      expect(result.findings.length).toBeGreaterThanOrEqual(2);
    });

    test('REQ fixture: missing user story and AC items', async () => {
      const files = await loadFixtureFiles(nonConformDir);
      const reqFile = files.find((f) => f.relName.startsWith('REQ-'));
      expect(reqFile).toBeDefined();
      if (!reqFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(reqFile.filePath, reqFile.relName)],
        remapped
      );

      const codes = result.findings.map((f) => f.code);
      expect(codes).toContain('schema-missing-content');
      // Missing: user story, AC heading, AC list items
      const missingContent = result.findings.filter((f) => f.code === 'schema-missing-content');
      expect(missingContent.length).toBeGreaterThanOrEqual(2);
    });

    test('DESIGN fixture: missing code blocks, IMPLEMENTS, properties', async () => {
      const files = await loadFixtureFiles(nonConformDir);
      const designFile = files.find((f) => f.relName.startsWith('DESIGN-'));
      expect(designFile).toBeDefined();
      if (!designFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(designFile.filePath, designFile.relName)],
        remapped
      );

      const codes = result.findings.map((f) => f.code);
      expect(codes).toContain('schema-missing-content');
      // Missing: mermaid diagram, directory structure, IMPLEMENTS, interface code block,
      //          property ID, VALIDATES, SOURCE declaration
      const missingContent = result.findings.filter((f) => f.code === 'schema-missing-content');
      expect(missingContent.length).toBeGreaterThanOrEqual(5);
    });

    test('FEAT fixture: missing INFORMATIVE marker and Conceptual Model', async () => {
      const files = await loadFixtureFiles(nonConformDir);
      const featFile = files.find((f) => f.relName.startsWith('FEAT-'));
      expect(featFile).toBeDefined();
      if (!featFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(featFile.filePath, featFile.relName)],
        remapped
      );

      const codes = result.findings.map((f) => f.code);
      // Missing: H1 with [INFORMATIVE], Conceptual Model section, Scenario children
      expect(codes).toContain('schema-missing-section');
      expect(result.findings.length).toBeGreaterThanOrEqual(2);
    });

    test('ARCHITECTURE fixture: missing code blocks and RESPONSIBILITIES', async () => {
      const files = await loadFixtureFiles(nonConformDir);
      const archFile = files.find((f) => f.relName === 'ARCHITECTURE.md');
      expect(archFile).toBeDefined();
      if (!archFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(archFile.filePath, archFile.relName)],
        remapped
      );

      const codes = result.findings.map((f) => f.code);
      expect(codes).toContain('schema-missing-content');
      // Missing: mermaid code block, directory tree code block, RESPONSIBILITIES
      const missingContent = result.findings.filter((f) => f.code === 'schema-missing-content');
      expect(missingContent.length).toBeGreaterThanOrEqual(3);
    });

    test('EXAMPLES fixture: missing INFORMATIVE marker and code block', async () => {
      const files = await loadFixtureFiles(nonConformDir);
      const exFile = files.find((f) => f.relName.startsWith('EXAMPLES-'));
      expect(exFile).toBeDefined();
      if (!exFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(exFile.filePath, exFile.relName)],
        remapped
      );

      const codes = result.findings.map((f) => f.code);
      // Missing: H1 with [INFORMATIVE], code block in example
      expect(codes).toContain('schema-missing-section');
      expect(codes).toContain('schema-missing-content');
    });

    test('ALIGN fixture: missing severity counts and STATUS', async () => {
      const files = await loadFixtureFiles(nonConformDir);
      const alignFile = files.find((f) => f.relName.startsWith('ALIGN-'));
      expect(alignFile).toBeDefined();
      if (!alignFile) return;

      const remapped = ruleSets.map((rs) => remapRuleSet(rs));
      const result = await checkSchemasAsync(
        [makeSpecFile(alignFile.filePath, alignFile.relName)],
        remapped
      );

      const codes = result.findings.map((f) => f.code);
      expect(codes).toContain('schema-missing-content');
      // Missing: severity count pattern, STATUS line
      const missingContent = result.findings.filter((f) => f.code === 'schema-missing-content');
      expect(missingContent.length).toBeGreaterThanOrEqual(2);
    });
  });
});
