// @awa-component: TRC-TokenEstimator
// @awa-impl: TRC-6_AC-1

import type { ContentSection } from './types.js';

/**
 * Estimate token count using a simple chars/4 heuristic.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Apply a token budget to content sections.
 * Sections must already be sorted by priority (ascending = highest priority first).
 * Returns the sections that fit within the budget, plus a footer message if truncated.
 */
export function applyTokenBudget(
  sections: ContentSection[],
  maxTokens: number
): { sections: ContentSection[]; truncated: boolean; footer: string | null } {
  if (maxTokens <= 0) {
    return { sections: [], truncated: sections.length > 0, footer: null };
  }

  const result: ContentSection[] = [];
  let usedTokens = 0;
  let omittedCount = 0;

  for (const section of sections) {
    const sectionTokens = estimateTokens(section.content);

    if (usedTokens + sectionTokens <= maxTokens) {
      result.push(section);
      usedTokens += sectionTokens;
    } else if (result.length === 0) {
      // Always include at least the first section (highest priority), even if over budget.
      // Truncate its content to fit.
      const availableChars = maxTokens * 4;
      const truncatedContent = section.content.slice(0, availableChars);
      result.push({ ...section, content: truncatedContent });
      usedTokens = maxTokens;
      // Remaining sections are omitted
      omittedCount = sections.length - 1;
      break;
    } else {
      omittedCount++;
    }
  }

  // Count remaining unprocessed sections
  if (omittedCount === 0) {
    omittedCount = sections.length - result.length;
  }

  const truncated = omittedCount > 0;
  const footer = truncated
    ? `... ${omittedCount} more section${omittedCount === 1 ? '' : 's'} omitted (use --max-tokens to increase)`
    : null;

  return { sections: result, truncated, footer };
}
