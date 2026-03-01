// @awa-component: TRC-ContentFormatter

import type { ContentSection } from './types.js';

/** File extension to Markdown language identifier. */
function langId(filePath: string): string {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
  if (filePath.endsWith('.md')) return 'markdown';
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.tsp')) return 'typespec';
  return '';
}

/** Map section type to a human-readable heading. */
function sectionHeading(type: ContentSection['type']): string {
  switch (type) {
    case 'task':
      return 'Task';
    case 'requirement':
      return 'Requirement';
    case 'design':
      return 'Design';
    case 'implementation':
      return 'Implementation';
    case 'test':
      return 'Test';
    default:
      return 'Other';
  }
}

/**
 * Format content sections as Markdown with headings, provenance, and code blocks.
 * @awa-impl: TRC-7_AC-1
 */
export function formatContentMarkdown(
  sections: ContentSection[],
  queryLabel: string,
  footer: string | null
): string {
  const lines: string[] = [];
  lines.push(`# Context: ${queryLabel}`);
  lines.push('');

  let lastType: string | null = null;

  for (const section of sections) {
    // Group by type — add H2 when type changes
    if (section.type !== lastType) {
      lines.push(`## ${sectionHeading(section.type)}`);
      lines.push('');
      lastType = section.type;
    }

    lines.push(`> From: ${section.filePath} (lines ${section.startLine}-${section.endLine})`);
    lines.push('');

    const isCode = section.type === 'implementation' || section.type === 'test';
    if (isCode) {
      const lang = langId(section.filePath);
      lines.push(`\`\`\`${lang}`);
      lines.push(section.content);
      lines.push('```');
    } else {
      lines.push(section.content);
    }
    lines.push('');
  }

  if (footer) {
    lines.push(`---`);
    lines.push(footer);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format content sections as JSON structure.
 * @awa-impl: TRC-7_AC-1
 */
export function formatContentJson(
  sections: ContentSection[],
  queryLabel: string,
  footer: string | null
): string {
  const result = {
    query: queryLabel,
    sections: sections.map((s) => ({
      type: s.type,
      filePath: s.filePath,
      startLine: s.startLine,
      endLine: s.endLine,
      content: s.content,
      priority: s.priority,
    })),
    estimatedTokens: Math.ceil(sections.reduce((sum, s) => sum + s.content.length, 0) / 4),
    filesIncluded: new Set(sections.map((s) => s.filePath)).size,
    ...(footer ? { truncated: true, truncationMessage: footer } : {}),
  };
  return JSON.stringify(result, null, 2);
}
