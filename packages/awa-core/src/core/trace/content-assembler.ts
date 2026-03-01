// @awa-component: TRC-ContentAssembler
// @awa-impl: TRC-5_AC-1, TRC-5_AC-2, TRC-5_AC-3, TRC-5_AC-4, TRC-5_AC-5

import { readFile } from 'node:fs/promises';
import type { ContentSection, TraceResult } from './types.js';

/** Default lines of context before a code marker. */
const DEFAULT_BEFORE_CONTEXT = 5;
/** Default lines of context after a code marker. */
const DEFAULT_AFTER_CONTEXT = 20;

/** Options for controlling code context extraction. */
interface ContextLineOptions {
  readonly beforeContext?: number;
  readonly afterContext?: number;
}

/**
 * Assemble content sections from a trace result by reading the actual files.
 * Returns ContentSections sorted by priority (lowest number = highest priority).
 */
export async function assembleContent(
  result: TraceResult,
  taskPath?: string,
  contextOptions?: ContextLineOptions
): Promise<ContentSection[]> {
  const beforeCtx = contextOptions?.beforeContext ?? DEFAULT_BEFORE_CONTEXT;
  const afterCtx = contextOptions?.afterContext ?? DEFAULT_AFTER_CONTEXT;
  const sections: ContentSection[] = [];
  const seen = new Set<string>();

  // Priority 1: Task file — full content
  if (taskPath) {
    const content = await safeReadFile(taskPath);
    if (content) {
      const lineCount = content.split('\n').length;
      sections.push({
        type: 'task',
        filePath: taskPath,
        startLine: 1,
        endLine: lineCount,
        content,
        priority: 1,
      });
    }
  }

  for (const chain of result.chains) {
    // Priority 2: Requirement
    if (chain.requirement) {
      const key = `req:${chain.requirement.location.filePath}:${chain.requirement.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        const section = await extractSpecSection(
          chain.requirement.location.filePath,
          chain.requirement.id,
          chain.requirement.location.line,
          'requirement',
          2
        );
        if (section) sections.push(section);
      }
    }

    // Also include ACs under requirement (they're typically in the same section)
    for (const ac of chain.acs) {
      const key = `ac:${ac.location.filePath}:${ac.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        // ACs are part of the requirement section — only add if different from requirement
        if (!chain.requirement || ac.location.filePath !== chain.requirement.location.filePath) {
          const section = await extractSpecSection(
            ac.location.filePath,
            ac.id,
            ac.location.line,
            'requirement',
            2
          );
          if (section) sections.push(section);
        }
      }
    }

    // Priority 3: Design components
    for (const comp of chain.designComponents) {
      const key = `design:${comp.location.filePath}:${comp.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        const section = await extractSpecSection(
          comp.location.filePath,
          comp.id,
          comp.location.line,
          'design',
          3
        );
        if (section) sections.push(section);
      }
    }

    // Priority 5: Implementation code
    for (const impl of chain.implementations) {
      const key = `impl:${impl.location.filePath}:${impl.location.line}`;
      if (!seen.has(key)) {
        seen.add(key);
        const section = await extractCodeSection(
          impl.location.filePath,
          impl.location.line,
          'implementation',
          5,
          beforeCtx,
          afterCtx
        );
        if (section) sections.push(section);
      }
    }

    // Priority 6: Test code
    for (const t of chain.tests) {
      const key = `test:${t.location.filePath}:${t.location.line}`;
      if (!seen.has(key)) {
        seen.add(key);
        const section = await extractCodeSection(
          t.location.filePath,
          t.location.line,
          'test',
          6,
          beforeCtx,
          afterCtx
        );
        if (section) sections.push(section);
      }
    }

    // Priority 5 (properties are also design-level) → tests already covered
    for (const prop of chain.properties) {
      const key = `prop:${prop.location.filePath}:${prop.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        const section = await extractSpecSection(
          prop.location.filePath,
          prop.id,
          prop.location.line,
          'design',
          3
        );
        if (section) sections.push(section);
      }
    }
  }

  // Sort by priority
  sections.sort((a, b) => a.priority - b.priority);

  return sections;
}

/**
 * Extract an H3 section from a spec file starting at or near the given line.
 * Reads from the H3 heading to the next H3 or H2 heading.
 */
async function extractSpecSection(
  filePath: string,
  _id: string,
  line: number,
  type: ContentSection['type'],
  priority: number
): Promise<ContentSection | null> {
  const content = await safeReadFile(filePath);
  if (!content) return null;

  const lines = content.split('\n');

  // Find the H3 heading at or before the given line
  let startIdx = line - 1;
  while (startIdx >= 0 && !/^###\s/.test(lines[startIdx] ?? '')) {
    startIdx--;
  }
  if (startIdx < 0) startIdx = Math.max(0, line - 1);

  // Find the end: next H2 or H3 heading
  let endIdx = startIdx + 1;
  while (endIdx < lines.length) {
    const l = lines[endIdx] ?? '';
    if (/^#{2,3}\s/.test(l) && endIdx > startIdx) break;
    endIdx++;
  }

  const sectionContent = lines.slice(startIdx, endIdx).join('\n').trimEnd();

  return {
    type,
    filePath,
    startLine: startIdx + 1,
    endLine: endIdx,
    content: sectionContent,
    priority,
  };
}

/**
 * Extract a code section around a marker line.
 * Tries to find the enclosing function/block; falls back to +/- DEFAULT_CONTEXT_LINES.
 */
async function extractCodeSection(
  filePath: string,
  line: number,
  type: ContentSection['type'],
  priority: number,
  beforeContext: number = DEFAULT_BEFORE_CONTEXT,
  afterContext: number = DEFAULT_AFTER_CONTEXT
): Promise<ContentSection | null> {
  const content = await safeReadFile(filePath);
  if (!content) return null;

  const lines = content.split('\n');
  const lineIdx = line - 1;

  // Try to find enclosing function/block
  const range = findEnclosingBlock(lines, lineIdx, beforeContext, afterContext);

  const sectionContent = lines
    .slice(range.start, range.end + 1)
    .join('\n')
    .trimEnd();

  return {
    type,
    filePath,
    startLine: range.start + 1,
    endLine: range.end + 1,
    content: sectionContent,
    priority,
  };
}

/**
 * Find the enclosing function or block around a given line index.
 * Uses simple brace-counting heuristic. Falls back to context window.
 */
function findEnclosingBlock(
  lines: string[],
  lineIdx: number,
  beforeContext: number = DEFAULT_BEFORE_CONTEXT,
  afterContext: number = DEFAULT_AFTER_CONTEXT
): { start: number; end: number } {
  // Search upward for a function-like declaration
  let start = lineIdx;
  for (let i = lineIdx; i >= 0; i--) {
    const l = lines[i] ?? '';
    // Detect function/method declarations, class declarations, test blocks
    if (
      /^\s*(export\s+)?(async\s+)?function\s/.test(l) ||
      /^\s*(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/.test(l) ||
      /^\s*(describe|test|it)\s*\(/.test(l) ||
      /^\s*(export\s+)?class\s/.test(l) ||
      /^\s*(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?function/.test(l)
    ) {
      start = i;
      break;
    }
    // Don't search too far up
    if (lineIdx - i > 50) {
      start = Math.max(0, lineIdx - beforeContext);
      break;
    }
  }

  // Search downward for the closing brace at the same level
  let braceCount = 0;
  let foundOpen = false;
  let end = lineIdx;

  for (let i = start; i < lines.length; i++) {
    const l = lines[i] ?? '';
    for (const ch of l) {
      if (ch === '{') {
        braceCount++;
        foundOpen = true;
      } else if (ch === '}') {
        braceCount--;
      }
    }
    if (foundOpen && braceCount <= 0) {
      end = i;
      break;
    }
    // Don't search too far down
    if (i - start > 100) {
      end = Math.min(lines.length - 1, lineIdx + afterContext);
      break;
    }
  }

  if (!foundOpen) {
    // Fallback: context window
    start = Math.max(0, lineIdx - beforeContext);
    end = Math.min(lines.length - 1, lineIdx + afterContext);
  }

  return { start, end };
}

async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}
