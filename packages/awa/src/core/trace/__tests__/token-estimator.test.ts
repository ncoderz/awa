// @awa-test: TRC-6_AC-1

import { describe, expect, it } from 'vitest';
import { applyTokenBudget, estimateTokens } from '../token-estimator.js';
import type { ContentSection } from '../types.js';

function makeSection(
  content: string,
  priority: number,
  type: ContentSection['type'] = 'requirement'
): ContentSection {
  return {
    type,
    filePath: '/test/file.md',
    startLine: 1,
    endLine: 10,
    content,
    priority,
  };
}

describe('estimateTokens', () => {
  it('should estimate tokens as chars / 4 rounded up', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('a')).toBe(1);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2);
    expect(estimateTokens('a'.repeat(100))).toBe(25);
  });
});

describe('applyTokenBudget', () => {
  it('should include all sections when within budget', () => {
    const sections = [makeSection('short text', 1), makeSection('another one', 2)];
    const { sections: result, truncated, footer } = applyTokenBudget(sections, 1000);
    expect(result).toHaveLength(2);
    expect(truncated).toBe(false);
    expect(footer).toBeNull();
  });

  it('should truncate low-priority sections when over budget', () => {
    const sections = [
      makeSection('a'.repeat(40), 1), // 10 tokens
      makeSection('b'.repeat(40), 2), // 10 tokens
      makeSection('c'.repeat(40), 3), // 10 tokens
    ];
    // Budget for ~20 tokens = 2 sections
    const { sections: result, truncated, footer } = applyTokenBudget(sections, 20);
    expect(result).toHaveLength(2);
    expect(truncated).toBe(true);
    expect(footer).toContain('1 more section omitted');
  });

  it('should always include at least the first section even if over budget', () => {
    const sections = [
      makeSection('a'.repeat(400), 1), // 100 tokens
      makeSection('b'.repeat(40), 2), // 10 tokens
    ];
    const { sections: result, truncated, footer } = applyTokenBudget(sections, 10);
    expect(result).toHaveLength(1);
    expect(result[0]?.content.length).toBe(40); // 10 tokens * 4 chars
    expect(truncated).toBe(true);
    expect(footer).toContain('1 more section');
  });

  it('should handle empty sections array', () => {
    const { sections: result, truncated, footer } = applyTokenBudget([], 1000);
    expect(result).toEqual([]);
    expect(truncated).toBe(false);
    expect(footer).toBeNull();
  });

  it('should handle zero budget', () => {
    const sections = [makeSection('content', 1)];
    const { sections: result, truncated } = applyTokenBudget(sections, 0);
    expect(result).toEqual([]);
    expect(truncated).toBe(true);
  });

  it('should pluralize footer message correctly', () => {
    const sections = [
      makeSection('a'.repeat(40), 1), // 10 tokens
      makeSection('b'.repeat(40), 2),
      makeSection('c'.repeat(40), 3),
      makeSection('d'.repeat(40), 4),
    ];
    const { footer } = applyTokenBudget(sections, 10);
    expect(footer).toContain('3 more sections omitted');
  });
});
