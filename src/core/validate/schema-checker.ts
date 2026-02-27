// @awa-component: VAL-SchemaChecker

import { readFile } from 'node:fs/promises';
import type { Code, Heading, List, PhrasingContent, Root, Table, TableRow } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { matchesTargetGlob } from './rule-loader.js';
import type {
  CodeBlockContainsRule,
  ContainsRule,
  HeadingOrTextContainsRule,
  ListContainsRule,
  LoadedRuleSet,
  PatternContainsRule,
  SectionRule,
  TableContainsRule,
  WhenCondition,
} from './rule-types.js';
import type { CheckResult, Finding, SpecFile } from './types.js';

/** A section with heading info and all AST nodes belonging to it. */
interface SectionNode {
  readonly heading: Heading;
  readonly headingText: string;
  readonly level: number;
  readonly children: SectionNode[];
  readonly contentNodes: Root['children'];
}

/**
 * Check all spec files against loaded rule sets.
 * Reads file content, parses to mdast, walks AST checking rules.
 */
export async function checkSchemasAsync(
  specFiles: readonly SpecFile[],
  ruleSets: readonly LoadedRuleSet[]
): Promise<CheckResult> {
  const findings: Finding[] = [];
  const parser = unified().use(remarkParse).use(remarkGfm);

  for (const spec of specFiles) {
    const matchingRules = ruleSets.filter((rs) => matchesTargetGlob(spec.filePath, rs.targetGlob));
    if (matchingRules.length === 0) continue;

    let content: string;
    try {
      content = await readFile(spec.filePath, 'utf-8');
    } catch {
      continue;
    }

    const tree = parser.parse(content);
    const sectionTree = buildSectionTree(tree);
    const allSections = flattenSections(sectionTree);

    for (const ruleSet of matchingRules) {
      findings.push(
        ...checkRulesAgainstSections(allSections, ruleSet.ruleFile.sections, spec.filePath)
      );

      if (ruleSet.ruleFile['sections-prohibited']) {
        findings.push(
          ...checkProhibited(content, ruleSet.ruleFile['sections-prohibited'], spec.filePath)
        );
      }
    }
  }

  return { findings };
}

// --- Section tree building ---

function buildSectionTree(tree: Root): SectionNode[] {
  return buildSectionsFromNodes(tree.children, 0, 0).sections;
}

function buildSectionsFromNodes(
  nodes: Root['children'],
  start: number,
  parentLevel: number
): { sections: SectionNode[]; nextIndex: number } {
  const sections: SectionNode[] = [];
  let i = start;

  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.type === 'heading') {
      const h = node as Heading;
      if (parentLevel > 0 && h.depth <= parentLevel) break;

      const headingText = extractText(h.children);
      const contentNodes: Root['children'] = [];
      i++;

      // Collect content until next heading of same-or-higher level
      while (i < nodes.length) {
        const next = nodes[i]!;
        if (next.type === 'heading') break;
        contentNodes.push(next);
        i++;
      }

      // Collect child headings (deeper level)
      const childResult = buildSectionsFromNodes(nodes, i, h.depth);
      i = childResult.nextIndex;

      sections.push({
        heading: h,
        headingText,
        level: h.depth,
        children: childResult.sections,
        contentNodes,
      });
    } else {
      i++;
    }
  }

  return { sections, nextIndex: i };
}

function flattenSections(sections: SectionNode[]): SectionNode[] {
  const result: SectionNode[] = [];
  for (const s of sections) {
    result.push(s);
    result.push(...flattenSections(s.children));
  }
  return result;
}

function extractText(children: PhrasingContent[]): string {
  return children
    .map((c) => {
      if ('value' in c) return c.value;
      if ('children' in c) return extractText(c.children as PhrasingContent[]);
      return '';
    })
    .join('');
}

// --- Rule checking ---

/**
 * Top-level rules match against the flattened view of all sections.
 * `children` sub-rules match only within the matched section's children.
 */
function checkRulesAgainstSections(
  allSections: SectionNode[],
  rules: readonly SectionRule[],
  filePath: string
): Finding[] {
  const findings: Finding[] = [];

  for (const rule of rules) {
    const matches = findMatchingSections(allSections, rule);

    if (matches.length === 0 && rule.required) {
      findings.push({
        severity: 'error',
        code: 'schema-missing-section',
        message: `Missing required section: '${rule.heading}' (level ${rule.level})`,
        filePath,
      });
      continue;
    }

    for (const match of matches) {
      if (match.level !== rule.level) {
        findings.push({
          severity: 'warning',
          code: 'schema-wrong-level',
          message: `Section '${match.headingText}' is level ${match.level}, expected ${rule.level}`,
          filePath,
          line: match.heading.position?.start.line,
        });
      }

      if (rule.contains) {
        for (const cr of rule.contains) {
          findings.push(...checkContainsRule(match, cr, filePath));
        }
      }

      if (rule.children) {
        const childFlat = flattenSections(match.children);
        findings.push(...checkRulesAgainstSections(childFlat, rule.children, filePath));
      }
    }
  }

  return findings;
}

function findMatchingSections(allSections: SectionNode[], rule: SectionRule): SectionNode[] {
  const regex = createHeadingRegex(rule.heading);
  const matches = allSections.filter((s) => s.level === rule.level && regex.test(s.headingText));

  if (!rule.repeatable && matches.length > 1) {
    return [matches[0]!];
  }
  return matches;
}

function createHeadingRegex(pattern: string): RegExp {
  if (/[.+*?^${}()|[\]\\]/.test(pattern)) {
    try {
      return new RegExp(`^${pattern}$`);
    } catch {
      return new RegExp(`^${escapeRegex(pattern)}$`);
    }
  }
  return new RegExp(`^${escapeRegex(pattern)}$`, 'i');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Contains rule dispatching ---

function checkContainsRule(section: SectionNode, rule: ContainsRule, filePath: string): Finding[] {
  // Evaluate 'when' condition gate — skip rule if condition not met
  const when = 'when' in rule ? (rule as { when?: WhenCondition }).when : undefined;
  if (when && !evaluateWhenCondition(when, section.headingText)) {
    return [];
  }

  if ('pattern' in rule && typeof rule.pattern === 'string') {
    return checkPatternContains(section, rule as PatternContainsRule, filePath);
  }
  if ('list' in rule) {
    return checkListContains(section, rule as ListContainsRule, filePath);
  }
  if ('table' in rule) {
    return checkTableContains(section, rule as TableContainsRule, filePath);
  }
  if ('code-block' in rule) {
    return checkCodeBlockContains(section, rule as CodeBlockContainsRule, filePath);
  }
  if ('heading-or-text' in rule) {
    return checkHeadingOrText(section, rule as HeadingOrTextContainsRule, filePath);
  }
  return [];
}

function checkPatternContains(
  section: SectionNode,
  rule: PatternContainsRule,
  filePath: string
): Finding[] {
  const text = getFullSectionText(section);
  const found = new RegExp(rule.pattern, 'm').test(text);

  // Prohibited mode: pattern must NOT appear
  if (rule.prohibited) {
    if (found) {
      return [
        {
          severity: 'warning',
          code: 'schema-prohibited',
          message: `Section '${section.headingText}' contains prohibited content: ${rule.label ?? rule.pattern}`,
          filePath,
          line: section.heading.position?.start.line,
        },
      ];
    }
    return [];
  }

  // Normal mode: pattern must appear
  if (found) return [];

  if (rule.required !== false) {
    return [
      {
        severity: 'error',
        code: 'schema-missing-content',
        message: `Section '${section.headingText}' missing required content: ${rule.label ?? rule.pattern}`,
        filePath,
        line: section.heading.position?.start.line,
      },
    ];
  }
  return [];
}

function checkListContains(
  section: SectionNode,
  rule: ListContainsRule,
  filePath: string
): Finding[] {
  const items = collectAllListItems(section);
  const regex = new RegExp(rule.list.pattern);
  const count = items.filter((item) => regex.test(item)).length;

  if (rule.list.min !== undefined && count < rule.list.min) {
    return [
      {
        severity: 'error',
        code: 'schema-missing-content',
        message: `Section '${section.headingText}' has ${count} matching ${rule.list.label ?? 'list items'}, expected at least ${rule.list.min}`,
        filePath,
        line: section.heading.position?.start.line,
      },
    ];
  }
  return [];
}

function checkTableContains(
  section: SectionNode,
  rule: TableContainsRule,
  filePath: string
): Finding[] {
  const tables = collectAllTables(section);

  if (tables.length === 0) {
    return [
      {
        severity: 'error',
        code: 'schema-missing-content',
        message: `Section '${section.headingText}' missing required table${rule.table.heading ? ` (${rule.table.heading})` : ''}`,
        filePath,
        line: section.heading.position?.start.line,
      },
    ];
  }

  // Find the first table whose columns match the rule. If none match, report
  // the column mismatch for the first table. This avoids false positives when a
  // section contains multiple tables with different column sets.
  let matched: Table | undefined;
  let firstMismatch: { table: Table; headers: string[] } | undefined;

  for (const table of tables) {
    const headerRow = table.children[0] as TableRow | undefined;
    if (!headerRow) continue;

    const headers = headerRow.children.map((cell) =>
      extractText(cell.children as PhrasingContent[]).trim()
    );

    if (rule.table.columns.every((col) => headers.includes(col))) {
      matched = table;
      break;
    }
    if (!firstMismatch) {
      firstMismatch = { table, headers };
    }
  }

  if (!matched) {
    const mm = firstMismatch;
    return [
      {
        severity: 'error',
        code: 'schema-table-columns',
        message: `No table in '${section.headingText}' has columns [${rule.table.columns.join(', ')}]${mm ? `, found [${mm.headers.join(', ')}]` : ''}`,
        filePath,
        line: mm?.table.position?.start.line ?? section.heading.position?.start.line,
      },
    ];
  }

  const findings: Finding[] = [];
  const dataRows = matched.children.length - 1;
  if (rule.table['min-rows'] !== undefined && dataRows < rule.table['min-rows']) {
    findings.push({
      severity: 'error',
      code: 'schema-missing-content',
      message: `Table in '${section.headingText}' has ${dataRows} data rows, expected at least ${rule.table['min-rows']}`,
      filePath,
      line: matched.position?.start.line,
    });
  }
  return findings;
}

function checkCodeBlockContains(
  section: SectionNode,
  rule: CodeBlockContainsRule,
  filePath: string
): Finding[] {
  if (collectAllCodeBlocks(section).length > 0) return [];

  return [
    {
      severity: 'error',
      code: 'schema-missing-content',
      message: `Section '${section.headingText}' missing required ${rule.label ?? 'code block'}`,
      filePath,
      line: section.heading.position?.start.line,
    },
  ];
}

function checkHeadingOrText(
  section: SectionNode,
  rule: HeadingOrTextContainsRule,
  filePath: string
): Finding[] {
  const needle = rule['heading-or-text'].toUpperCase();

  if (section.children.some((c) => c.headingText.toUpperCase().includes(needle))) return [];
  if (getFullSectionText(section).toUpperCase().includes(needle)) return [];

  if (rule.required !== false) {
    return [
      {
        severity: 'error',
        code: 'schema-missing-content',
        message: `Section '${section.headingText}' missing required heading or text: '${rule['heading-or-text']}'`,
        filePath,
        line: section.heading.position?.start.line,
      },
    ];
  }
  return [];
}

// --- When condition evaluation ---

function evaluateWhenCondition(when: WhenCondition, headingText: string): boolean {
  if (when['heading-matches']) {
    if (!new RegExp(when['heading-matches']).test(headingText)) return false;
  }
  if (when['heading-not-matches']) {
    if (new RegExp(when['heading-not-matches']).test(headingText)) return false;
  }
  return true;
}

// --- Prohibited patterns ---

function checkProhibited(
  content: string,
  prohibited: readonly string[],
  filePath: string
): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (const pattern of prohibited) {
    const regex = new RegExp(escapeRegex(pattern));
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      if (regex.test(line)) {
        findings.push({
          severity: 'warning',
          code: 'schema-prohibited',
          message: `Prohibited formatting '${pattern}' found`,
          filePath,
          line: i + 1,
        });
        break;
      }
    }
  }
  return findings;
}

// --- Content extraction helpers ---

function getFullSectionText(section: SectionNode): string {
  let text = section.contentNodes.map(nodeToText).join('\n');
  for (const child of section.children) {
    text += `\n${child.headingText}\n${getFullSectionText(child)}`;
  }
  return text;
}

function nodeToText(node: Root['children'][number]): string {
  if ('value' in node) return node.value as string;
  if ('children' in node) {
    return (node.children as Root['children'])
      .map((c) => nodeToText(c as Root['children'][number]))
      .join('');
  }
  return '';
}

function extractListItems(nodes: Root['children']): string[] {
  const items: string[] = [];
  for (const node of nodes) {
    if (node.type === 'list') {
      for (const item of (node as List).children) {
        const raw = nodeToText(item as unknown as Root['children'][number]);
        // remark-gfm stores checkbox state as a `checked` property on the listItem
        // rather than preserving the literal [ ] / [x] text. Reconstruct it for
        // rules that match checkbox syntax (e.g. \[ \] T-CODE-nnn).
        const li = item as { checked?: boolean | null };
        if (li.checked === true) {
          items.push(`[x] ${raw}`);
        } else if (li.checked === false) {
          items.push(`[ ] ${raw}`);
        } else {
          items.push(raw);
        }
      }
    }
  }
  return items;
}

function collectAllListItems(section: SectionNode): string[] {
  const items = extractListItems(section.contentNodes);
  for (const child of section.children) items.push(...collectAllListItems(child));
  return items;
}

function collectAllTables(section: SectionNode): Table[] {
  const tables = section.contentNodes.filter((n) => n.type === 'table') as Table[];
  for (const child of section.children) tables.push(...collectAllTables(child));
  return tables;
}

function collectAllCodeBlocks(section: SectionNode): Code[] {
  const blocks = section.contentNodes.filter((n) => n.type === 'code') as Code[];
  for (const child of section.children) blocks.push(...collectAllCodeBlocks(child));
  return blocks;
}
