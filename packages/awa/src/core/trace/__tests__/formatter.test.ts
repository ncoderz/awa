import { describe, expect, test } from 'vitest';
import { formatJson, formatList, formatTree } from '../formatter.js';
import type { TraceResult } from '../types.js';

// @awa-test: TRC-4_AC-1
// @awa-test: TRC-9_AC-1, TRC-10_AC-1

const sampleResult: TraceResult = {
  chains: [
    {
      queryId: 'DIFF-1_AC-1',
      requirement: {
        id: 'DIFF-1',
        type: 'requirement',
        location: { filePath: '.awa/specs/REQ-DIFF-diff.md', line: 18 },
      },
      acs: [
        {
          id: 'DIFF-1_AC-1',
          type: 'ac',
          location: { filePath: '.awa/specs/REQ-DIFF-diff.md', line: 22 },
        },
      ],
      designComponents: [
        {
          id: 'DIFF-DiffEngine',
          type: 'component',
          location: { filePath: '.awa/specs/DESIGN-DIFF-diff.md', line: 20 },
        },
      ],
      implementations: [
        {
          id: 'DIFF-1_AC-1',
          type: 'implementation',
          location: { filePath: 'src/core/differ.ts', line: 42 },
        },
      ],
      tests: [
        {
          id: 'DIFF-1_AC-1',
          type: 'test',
          location: { filePath: 'src/core/__tests__/differ.test.ts', line: 15 },
        },
      ],
      properties: [],
    },
  ],
  notFound: [],
};

describe('formatTree', () => {
  test('produces a readable tree structure', () => {
    const output = formatTree(sampleResult);

    expect(output).toContain('DIFF-1_AC-1');
    expect(output).toContain('▲ Requirement');
    expect(output).toContain('DIFF-1 (.awa/specs/REQ-DIFF-diff.md:18)');
    expect(output).toContain('▼ Design');
    expect(output).toContain('DIFF-DiffEngine');
    expect(output).toContain('▼ Implementation');
    expect(output).toContain('src/core/differ.ts:42');
    expect(output).toContain('▼ Tests');
    expect(output).toContain('src/core/__tests__/differ.test.ts:15');
  });

  test('shows not-found IDs', () => {
    const result: TraceResult = { chains: [], notFound: ['NOPE-1'] };
    const output = formatTree(result);

    expect(output).toContain('✗ NOPE-1: not found');
  });
});

// @awa-test: TRC-9_AC-1
describe('formatList', () => {
  test('outputs deduplicated file paths with line numbers', () => {
    const output = formatList(sampleResult);
    const lines = output.split('\n');

    expect(lines).toContain('.awa/specs/REQ-DIFF-diff.md:18');
    expect(lines).toContain('.awa/specs/DESIGN-DIFF-diff.md:20');
    expect(lines).toContain('src/core/differ.ts:42');
    expect(lines).toContain('src/core/__tests__/differ.test.ts:15');
  });
});

// @awa-test: TRC-10_AC-1
describe('formatJson', () => {
  test('produces valid JSON with chain structure', () => {
    const output = formatJson(sampleResult);
    const parsed = JSON.parse(output);

    expect(parsed.chains).toHaveLength(1);
    expect(parsed.chains[0].queryId).toBe('DIFF-1_AC-1');
    expect(parsed.chains[0].requirement.id).toBe('DIFF-1');
    expect(parsed.chains[0].implementations).toHaveLength(1);
    expect(parsed.notFound).toEqual([]);
  });

  test('includes notFound in JSON', () => {
    const result: TraceResult = { chains: [], notFound: ['NOPE-1'] };
    const parsed = JSON.parse(formatJson(result));

    expect(parsed.notFound).toEqual(['NOPE-1']);
  });
});
