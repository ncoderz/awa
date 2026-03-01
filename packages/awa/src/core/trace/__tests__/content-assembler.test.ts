// @awa-test: TRC-5_AC-1, TRC-5_AC-2, TRC-5_AC-3, TRC-5_AC-4

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assembleContent } from '../content-assembler.js';
import type { TraceChain, TraceResult } from '../types.js';

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'node:fs/promises';

const mockReadFile = vi.mocked(readFile);

function makeChain(overrides: Partial<TraceChain> = {}): TraceChain {
  return {
    queryId: 'TEST-1',
    requirement: undefined,
    acs: [],
    designComponents: [],
    properties: [],
    implementations: [],
    tests: [],
    ...overrides,
  };
}

function makeResult(chains: TraceChain[]): TraceResult {
  return { chains, notFound: [] };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('assembleContent', () => {
  it('should return empty array for empty result', async () => {
    const result = makeResult([]);
    const sections = await assembleContent(result);
    expect(sections).toEqual([]);
  });

  it('should include task file as priority 1', async () => {
    mockReadFile.mockResolvedValueOnce('# Task\n\nDo stuff\nMore lines\n');

    const result = makeResult([]);
    const sections = await assembleContent(result, '/p/tasks/TASK-001.md');

    expect(sections).toHaveLength(1);
    expect(sections[0]?.type).toBe('task');
    expect(sections[0]?.priority).toBe(1);
    expect(sections[0]?.filePath).toBe('/p/tasks/TASK-001.md');
  });

  it('should extract spec sections for requirements', async () => {
    const reqContent = [
      '# Requirements',
      '',
      '## Feature',
      '',
      '### TEST-1: Test requirement',
      '',
      'When something, the system shall do stuff.',
      '',
      '#### TEST-1_AC-1: Acceptance',
      '',
      'Verified by checking.',
      '',
      '### TEST-2: Next requirement',
      '',
      'Another one.',
    ].join('\n');

    mockReadFile.mockResolvedValue(reqContent);

    const chain = makeChain({
      queryId: 'TEST-1',
      requirement: {
        id: 'TEST-1',
        type: 'requirement',
        location: { filePath: '/p/specs/REQ-TEST.md', line: 5 },
      },
    });

    const sections = await assembleContent(makeResult([chain]));

    expect(sections).toHaveLength(1);
    expect(sections[0]?.type).toBe('requirement');
    expect(sections[0]?.priority).toBe(2);
    // Should contain the section text
    expect(sections[0]?.content).toContain('### TEST-1');
    // Should NOT contain the next section
    expect(sections[0]?.content).not.toContain('### TEST-2');
  });

  it('should extract code sections for implementations', async () => {
    const codeContent = [
      'import { something } from "./other.js";',
      '',
      '// @awa-' + 'component: TEST-Parser',
      'export function parseStuff(input: string): Result {',
      '  // @awa-' + 'impl: TEST-1_AC-1',
      '  const result = input.split(",");',
      '  return { items: result };',
      '}',
      '',
      'export function otherFunction() {',
      '  return 42;',
      '}',
    ].join('\n');

    mockReadFile.mockResolvedValue(codeContent);

    const chain = makeChain({
      queryId: 'TEST-1_AC-1',
      implementations: [
        {
          id: 'TEST-1_AC-1',
          type: 'implementation',
          location: { filePath: '/p/src/parser.ts', line: 5 },
        },
      ],
    });

    const sections = await assembleContent(makeResult([chain]));

    expect(sections).toHaveLength(1);
    expect(sections[0]?.type).toBe('implementation');
    expect(sections[0]?.priority).toBe(5);
    expect(sections[0]?.content).toContain('export function parseStuff');
    expect(sections[0]?.content).toContain('return { items: result }');
  });

  it('should deduplicate sections with the same key', async () => {
    const specContent = ['### TEST-1: Requirement', '', 'Details here.', ''].join('\n');

    mockReadFile.mockResolvedValue(specContent);

    // Two chains referencing the same requirement
    const chain1 = makeChain({
      queryId: 'TEST-1',
      requirement: {
        id: 'TEST-1',
        type: 'requirement',
        location: { filePath: '/p/specs/REQ.md', line: 1 },
      },
    });
    const chain2 = makeChain({
      queryId: 'TEST-1',
      requirement: {
        id: 'TEST-1',
        type: 'requirement',
        location: { filePath: '/p/specs/REQ.md', line: 1 },
      },
    });

    const sections = await assembleContent(makeResult([chain1, chain2]));

    // Should only have one requirement section, not two
    expect(sections).toHaveLength(1);
  });

  it('should sort sections by priority', async () => {
    const taskContent = '# Task\nDo stuff\n';
    const specContent = '### TEST-1: Req\nDetails.\n';
    const codeContent = [
      'export function run() {',
      '  // @awa-' + 'impl: TEST-1_AC-1',
      '  return true;',
      '}',
    ].join('\n');

    // Task file read
    mockReadFile.mockResolvedValueOnce(taskContent);
    // Requirement read (called twice due to dedup check, but only first matters)
    mockReadFile.mockResolvedValueOnce(specContent);
    // Code read
    mockReadFile.mockResolvedValueOnce(codeContent);

    const chain = makeChain({
      queryId: 'TEST-1',
      requirement: {
        id: 'TEST-1',
        type: 'requirement',
        location: { filePath: '/p/specs/REQ.md', line: 1 },
      },
      implementations: [
        {
          id: 'TEST-1_AC-1',
          type: 'implementation',
          location: { filePath: '/p/src/run.ts', line: 2 },
        },
      ],
    });

    const sections = await assembleContent(makeResult([chain]), '/p/tasks/TASK-001.md');

    expect(sections.length).toBeGreaterThanOrEqual(3);
    // Priorities should be in order
    for (let i = 1; i < sections.length; i++) {
      expect(sections[i]!.priority).toBeGreaterThanOrEqual(sections[i - 1]!.priority);
    }
    expect(sections[0]?.type).toBe('task');
  });

  it('should handle unreadable files gracefully', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    const chain = makeChain({
      queryId: 'TEST-1',
      requirement: {
        id: 'TEST-1',
        type: 'requirement',
        location: { filePath: '/missing/file.md', line: 1 },
      },
    });

    const sections = await assembleContent(makeResult([chain]));

    expect(sections).toEqual([]);
  });

  // @awa-test: TRC-5_AC-2
  it('should respect afterContext (-A) option for code sections', async () => {
    // 20 lines of simple code with a marker in the middle and no enclosing block
    const lines = Array.from({ length: 20 }, (_, i) => `const line${i} = ${i};`);
    lines[10] = '// @awa-' + 'impl: TEST-1_AC-1';
    mockReadFile.mockResolvedValue(lines.join('\n'));

    const chain = makeChain({
      queryId: 'TEST-1_AC-1',
      implementations: [
        {
          id: 'TEST-1_AC-1',
          type: 'implementation',
          location: { filePath: '/p/src/flat.ts', line: 11 },
        },
      ],
    });

    const sections = await assembleContent(makeResult([chain]), undefined, { afterContext: 2 });

    expect(sections).toHaveLength(1);
    // With afterContext=2, the section should end close to the marker line
    const contentLines = sections[0]!.content.split('\n');
    // Should NOT include many lines after the marker
    expect(contentLines.length).toBeLessThanOrEqual(10);
  });

  // @awa-test: TRC-5_AC-3
  it('should respect beforeContext (-B) option for code sections', async () => {
    const lines = Array.from({ length: 20 }, (_, i) => `const line${i} = ${i};`);
    lines[10] = '// @awa-' + 'impl: TEST-1_AC-1';
    mockReadFile.mockResolvedValue(lines.join('\n'));

    const chain = makeChain({
      queryId: 'TEST-1_AC-1',
      implementations: [
        {
          id: 'TEST-1_AC-1',
          type: 'implementation',
          location: { filePath: '/p/src/flat.ts', line: 11 },
        },
      ],
    });

    const sections = await assembleContent(makeResult([chain]), undefined, { beforeContext: 1 });

    expect(sections).toHaveLength(1);
    // With beforeContext=1, the start line should be very close to line 11
    expect(sections[0]!.startLine).toBeGreaterThanOrEqual(9);
  });

  // @awa-test: TRC-5_AC-4
  it('should use -C value for both before and after context', async () => {
    const lines = Array.from({ length: 30 }, (_, i) => `const line${i} = ${i};`);
    lines[15] = '// @awa-' + 'impl: TEST-1_AC-1';
    mockReadFile.mockResolvedValue(lines.join('\n'));

    const chain = makeChain({
      queryId: 'TEST-1_AC-1',
      implementations: [
        {
          id: 'TEST-1_AC-1',
          type: 'implementation',
          location: { filePath: '/p/src/flat.ts', line: 16 },
        },
      ],
    });

    // -C sets both before and after to the same value
    const sections = await assembleContent(makeResult([chain]), undefined, {
      beforeContext: 3,
      afterContext: 3,
    });

    expect(sections).toHaveLength(1);
    const contentLines = sections[0]!.content.split('\n');
    // With C=3, total lines should be around 7 (3 before + marker + 3 after)
    expect(contentLines.length).toBeLessThanOrEqual(10);
  });
});
