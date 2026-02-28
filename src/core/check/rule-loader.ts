// @awa-component: CHK-RuleLoader

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { collectFiles, matchSimpleGlob } from './glob.js';
import type {
  CodeBlockContainsRule,
  ContainsRule,
  HeadingOrTextContainsRule,
  ListContainsRule,
  LoadedRuleSet,
  PatternContainsRule,
  RuleFile,
  SectionRule,
  TableContainsRule,
  WhenCondition,
} from './rule-types.js';

/**
 * Discover and load all *.schema.yaml files from the given schema directory.
 * Parses YAML, validates rule structure, and returns typed rule sets.
 */
export async function loadRules(schemaDir: string): Promise<LoadedRuleSet[]> {
  const pattern = join(schemaDir, '*.schema.yaml');
  const files = await collectFiles([pattern], []);
  const results: LoadedRuleSet[] = [];

  for (const filePath of files) {
    const ruleSet = await loadRuleFile(filePath);
    if (ruleSet) {
      results.push(ruleSet);
    }
  }

  return results;
}

/**
 * Match spec file paths against a loaded rule set's target-files glob.
 */
export function matchesTargetGlob(filePath: string, targetGlob: string): boolean {
  return matchSimpleGlob(filePath, targetGlob);
}

async function loadRuleFile(filePath: string): Promise<LoadedRuleSet | null> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }

  const parsed = parseYaml(content) as unknown;
  if (!parsed || typeof parsed !== 'object') {
    throw new RuleValidationError(`Rule file is not a valid YAML object: ${filePath}`);
  }

  const raw = parsed as Record<string, unknown>;
  const ruleFile = validateRuleFile(raw, filePath);

  return {
    ruleFile,
    sourcePath: filePath,
    targetGlob: ruleFile['target-files'],
  };
}

function validateRuleFile(raw: Record<string, unknown>, filePath: string): RuleFile {
  // target-files is required
  if (typeof raw['target-files'] !== 'string' || raw['target-files'].length === 0) {
    throw new RuleValidationError(`Missing or empty 'target-files' in ${filePath}`);
  }

  // sections is optional (e.g., API rules target non-markdown files)
  let sections: SectionRule[] | undefined;
  if (raw.sections !== undefined) {
    if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
      throw new RuleValidationError(
        `'sections' must be a non-empty array if present in ${filePath}`
      );
    }
    sections = raw.sections.map((s: unknown, i: number) =>
      validateSectionRule(s, `sections[${i}]`, filePath)
    );
  }

  // sections-prohibited is optional
  let sectionsProhibited: string[] | undefined;
  if (raw['sections-prohibited'] !== undefined) {
    if (
      !Array.isArray(raw['sections-prohibited']) ||
      !raw['sections-prohibited'].every((v: unknown) => typeof v === 'string')
    ) {
      throw new RuleValidationError(`'sections-prohibited' must be a string array in ${filePath}`);
    }
    sectionsProhibited = raw['sections-prohibited'] as string[];
  }

  return {
    'target-files': raw['target-files'] as string,
    ...(typeof raw.description === 'string' ? { description: raw.description } : {}),
    ...(typeof raw['line-limit'] === 'number' && raw['line-limit'] > 0
      ? { 'line-limit': raw['line-limit'] }
      : {}),
    sections: sections ?? [],
    ...(sectionsProhibited ? { 'sections-prohibited': sectionsProhibited } : {}),
    ...(typeof raw.example === 'string' ? { example: raw.example } : {}),
  };
}

function validateSectionRule(raw: unknown, path: string, filePath: string): SectionRule {
  if (!raw || typeof raw !== 'object') {
    throw new RuleValidationError(`${path} must be an object in ${filePath}`);
  }

  const section = raw as Record<string, unknown>;

  if (typeof section.heading !== 'string' || section.heading.length === 0) {
    throw new RuleValidationError(`${path}.heading must be a non-empty string in ${filePath}`);
  }

  if (typeof section.level !== 'number' || section.level < 1 || section.level > 6) {
    throw new RuleValidationError(`${path}.level must be 1-6 in ${filePath}`);
  }

  // Validate heading as regex if it looks like a pattern
  validatePattern(section.heading as string, `${path}.heading`, filePath);

  // Validate optional contains rules
  let contains: ContainsRule[] | undefined;
  if (section.contains !== undefined) {
    if (!Array.isArray(section.contains)) {
      throw new RuleValidationError(`${path}.contains must be an array in ${filePath}`);
    }
    contains = section.contains.map((c: unknown, i: number) =>
      validateContainsRule(c, `${path}.contains[${i}]`, filePath)
    );
  }

  // Validate optional children rules
  let children: SectionRule[] | undefined;
  if (section.children !== undefined) {
    if (!Array.isArray(section.children)) {
      throw new RuleValidationError(`${path}.children must be an array in ${filePath}`);
    }
    children = section.children.map((c: unknown, i: number) =>
      validateSectionRule(c, `${path}.children[${i}]`, filePath)
    );
  }

  return {
    heading: section.heading as string,
    level: section.level as number,
    ...(typeof section.required === 'boolean' ? { required: section.required } : {}),
    ...(typeof section.repeatable === 'boolean' ? { repeatable: section.repeatable } : {}),
    ...(typeof section.description === 'string' ? { description: section.description } : {}),
    ...(contains ? { contains } : {}),
    ...(children ? { children } : {}),
  };
}

function validateContainsRule(raw: unknown, path: string, filePath: string): ContainsRule {
  if (!raw || typeof raw !== 'object') {
    throw new RuleValidationError(`${path} must be an object in ${filePath}`);
  }

  const rule = raw as Record<string, unknown>;

  // Parse optional 'when' condition (applicable to all rule types)
  const when =
    rule.when !== undefined
      ? validateWhenCondition(rule.when, `${path}.when`, filePath)
      : undefined;

  // Pattern rule
  if (typeof rule.pattern === 'string') {
    validatePattern(rule.pattern, `${path}.pattern`, filePath);
    return {
      pattern: rule.pattern,
      ...(typeof rule.label === 'string' ? { label: rule.label } : {}),
      ...(typeof rule.description === 'string' ? { description: rule.description } : {}),
      ...(typeof rule.required === 'boolean' ? { required: rule.required } : {}),
      ...(typeof rule.prohibited === 'boolean' ? { prohibited: rule.prohibited } : {}),
      ...(when ? { when } : {}),
    } satisfies PatternContainsRule;
  }

  // List rule
  if (rule.list && typeof rule.list === 'object') {
    const list = rule.list as Record<string, unknown>;
    if (typeof list.pattern !== 'string') {
      throw new RuleValidationError(`${path}.list.pattern must be a string in ${filePath}`);
    }
    validatePattern(list.pattern, `${path}.list.pattern`, filePath);
    return {
      list: {
        pattern: list.pattern,
        ...(typeof list.min === 'number' ? { min: list.min } : {}),
        ...(typeof list.label === 'string' ? { label: list.label } : {}),
      },
      ...(typeof rule.description === 'string' ? { description: rule.description } : {}),
      ...(when ? { when } : {}),
    } satisfies ListContainsRule;
  }

  // Table rule
  if (rule.table && typeof rule.table === 'object') {
    const table = rule.table as Record<string, unknown>;
    if (
      !Array.isArray(table.columns) ||
      !table.columns.every((c: unknown) => typeof c === 'string')
    ) {
      throw new RuleValidationError(`${path}.table.columns must be a string array in ${filePath}`);
    }
    return {
      table: {
        ...(typeof table.heading === 'string' ? { heading: table.heading } : {}),
        columns: table.columns as string[],
        ...(typeof table['min-rows'] === 'number' ? { 'min-rows': table['min-rows'] } : {}),
      },
      ...(typeof rule.description === 'string' ? { description: rule.description } : {}),
      ...(when ? { when } : {}),
    } satisfies TableContainsRule;
  }

  // Code block rule
  if (rule['code-block'] === true) {
    return {
      'code-block': true,
      ...(typeof rule.label === 'string' ? { label: rule.label } : {}),
      ...(typeof rule.description === 'string' ? { description: rule.description } : {}),
      ...(when ? { when } : {}),
    } satisfies CodeBlockContainsRule;
  }

  // Heading-or-text rule
  if (typeof rule['heading-or-text'] === 'string') {
    return {
      'heading-or-text': rule['heading-or-text'],
      ...(typeof rule.required === 'boolean' ? { required: rule.required } : {}),
      ...(typeof rule.description === 'string' ? { description: rule.description } : {}),
      ...(when ? { when } : {}),
    } satisfies HeadingOrTextContainsRule;
  }

  throw new RuleValidationError(`${path} has no recognized rule type in ${filePath}`);
}

function validateWhenCondition(raw: unknown, path: string, filePath: string): WhenCondition {
  if (!raw || typeof raw !== 'object') {
    throw new RuleValidationError(`${path} must be an object in ${filePath}`);
  }

  const condition = raw as Record<string, unknown>;
  const result: Record<string, string> = {};

  if (typeof condition['heading-matches'] === 'string') {
    validatePattern(condition['heading-matches'], `${path}.heading-matches`, filePath);
    result['heading-matches'] = condition['heading-matches'];
  }

  if (typeof condition['heading-not-matches'] === 'string') {
    validatePattern(condition['heading-not-matches'], `${path}.heading-not-matches`, filePath);
    result['heading-not-matches'] = condition['heading-not-matches'];
  }

  if (!result['heading-matches'] && !result['heading-not-matches']) {
    throw new RuleValidationError(
      `${path} must have 'heading-matches' or 'heading-not-matches' in ${filePath}`
    );
  }

  return result as unknown as WhenCondition;
}

function validatePattern(pattern: string, path: string, filePath: string): void {
  // Only validate if it looks like a regex (contains regex special chars)
  if (/[.+*?^${}()|[\]\\]/.test(pattern)) {
    try {
      new RegExp(pattern);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new RuleValidationError(`Invalid regex in ${path}: ${msg} (${filePath})`);
    }
  }
}

export class RuleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleValidationError';
  }
}
