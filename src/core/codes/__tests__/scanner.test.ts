import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { SpecFile } from '../../check/types.js';
import { extractFirstParagraph, extractScopeBoundary, scanCodes } from '../scanner.js';

// Mock the glob-based file discovery and readFile
vi.mock('../../check/glob.js', () => ({
  collectFiles: vi.fn(),
}));
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'node:fs/promises';

import { collectFiles } from '../../check/glob.js';

function makeSpecFile(overrides: Partial<SpecFile>): SpecFile {
  return {
    filePath: '',
    code: '',
    requirementIds: [],
    acIds: [],
    propertyIds: [],
    componentNames: [],
    crossRefs: [],
    ...overrides,
  };
}

describe('scanCodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(collectFiles).mockResolvedValue([]);
  });

  test('discovers codes from REQ files', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/REQ-CHK-check.md',
        code: 'CHK',
        requirementIds: ['CHK-1', 'CHK-2', 'CHK-3'],
      }),
      makeSpecFile({
        filePath: '.awa/specs/REQ-TRC-trace.md',
        code: 'TRC',
        requirementIds: ['TRC-1', 'TRC-2'],
      }),
    ];

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes).toHaveLength(2);
    expect(result.codes[0]).toEqual(
      expect.objectContaining({
        code: 'CHK',
        feature: 'check',
        reqCount: 3,
        docs: { feat: false, req: true, design: false, api: false, example: false },
      })
    );
    expect(result.codes[1]).toEqual(
      expect.objectContaining({
        code: 'TRC',
        feature: 'trace',
        reqCount: 2,
        docs: { feat: false, req: true, design: false, api: false, example: false },
      })
    );
  });

  test('sorts codes alphabetically', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/REQ-TRC-trace.md',
        code: 'TRC',
        requirementIds: ['TRC-1'],
      }),
      makeSpecFile({
        filePath: '.awa/specs/REQ-CHK-check.md',
        code: 'CHK',
        requirementIds: ['CHK-1'],
      }),
      makeSpecFile({
        filePath: '.awa/specs/REQ-CLI-cli.md',
        code: 'CLI',
        requirementIds: ['CLI-1'],
      }),
    ];

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes.map((c) => c.code)).toEqual(['CHK', 'CLI', 'TRC']);
  });

  test('accumulates requirement counts across multiple REQ files for same code', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/REQ-CHK-check.md',
        code: 'CHK',
        requirementIds: ['CHK-1', 'CHK-2'],
      }),
      makeSpecFile({
        filePath: '.awa/specs/REQ-CHK-check-extra.md',
        code: 'CHK',
        requirementIds: ['CHK-3'],
      }),
    ];

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes).toHaveLength(1);
    expect(result.codes[0]?.reqCount).toBe(3);
  });

  test('ignores non-REQ spec files', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/DESIGN-CHK-check.md',
        code: 'CHK',
        requirementIds: [],
      }),
      makeSpecFile({
        filePath: '.awa/specs/FEAT-CHK-check.md',
        code: 'CHK',
        requirementIds: [],
      }),
      makeSpecFile({
        filePath: '.awa/specs/REQ-CHK-check.md',
        code: 'CHK',
        requirementIds: ['CHK-1'],
      }),
    ];

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes).toHaveLength(1);
    expect(result.codes[0]?.code).toBe('CHK');
    expect(result.codes[0]?.docs).toEqual({
      feat: true,
      req: true,
      design: true,
      api: false,
      example: false,
    });
  });

  test('discovers codes from FEAT, DESIGN, and API files without REQ', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/DESIGN-OVL-overlays.md',
        code: 'OVL',
        requirementIds: [],
      }),
      makeSpecFile({
        filePath: '.awa/specs/API-OVL-rest.tsp',
        code: 'OVL',
        requirementIds: [],
      }),
    ];

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes).toHaveLength(1);
    expect(result.codes[0]).toEqual(
      expect.objectContaining({
        code: 'OVL',
        feature: 'overlays',
        reqCount: 0,
        docs: { feat: false, req: false, design: true, api: true, example: false },
      })
    );
  });

  test('handles empty project with no spec files', async () => {
    const result = await scanCodes([], ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes).toHaveLength(0);
  });

  test('extracts scope from FEAT Scope Boundary section', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/REQ-CHK-check.md',
        code: 'CHK',
        requirementIds: ['CHK-1'],
      }),
    ];

    vi.mocked(collectFiles).mockResolvedValue(['.awa/specs/FEAT-CHK-check.md']);
    vi.mocked(readFile).mockResolvedValue(
      '# Check [INFORMATIVE]\n\n## Scope Boundary\n\nTraceability validation.\n\n## Problem\n\nThis is the problem.\n\n## More'
    );

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes[0]?.scope).toBe('Traceability validation.');
  });

  test('falls back to FEAT first paragraph when no Scope Boundary', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/REQ-CHK-check.md',
        code: 'CHK',
        requirementIds: ['CHK-1'],
      }),
    ];

    vi.mocked(collectFiles).mockResolvedValue(['.awa/specs/FEAT-CHK-check.md']);
    vi.mocked(readFile).mockResolvedValue(
      '# Check [INFORMATIVE]\n\n## Problem\n\nThis is the scope summary.\n\n## More'
    );

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes[0]?.scope).toBe('This is the scope summary.');
  });

  test('falls back to REQ first paragraph when no FEAT file', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/REQ-CLI-cli.md',
        code: 'CLI',
        requirementIds: ['CLI-1'],
      }),
    ];

    vi.mocked(collectFiles).mockResolvedValue([]);
    vi.mocked(readFile).mockResolvedValue(
      '# CLI Requirements\n\n## CLI-1: Command parsing\n\nThe CLI shall parse arguments.\n\n## CLI-2'
    );

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes[0]?.scope).toBe('The CLI shall parse arguments.');
  });

  test('falls back to DESIGN first paragraph when no FEAT or REQ scope', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/REQ-OVL-overlays.md',
        code: 'OVL',
        requirementIds: ['OVL-1'],
      }),
      makeSpecFile({
        filePath: '.awa/specs/DESIGN-OVL-overlays.md',
        code: 'OVL',
        requirementIds: [],
      }),
    ];

    vi.mocked(collectFiles).mockResolvedValue([]);
    // REQ file has no paragraph — readFile returns based on filePath
    vi.mocked(readFile).mockImplementation(async (path) => {
      if (String(path).includes('REQ-')) return '# REQ\n\n';
      if (String(path).includes('DESIGN-'))
        return '# Design\n\n## OVL-Resolver\n\nResolves overlays from multiple sources.\n\n## Next';
      return '';
    });

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes[0]?.scope).toBe('Resolves overlays from multiple sources.');
  });

  test('returns empty scope when no FEAT file exists', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/REQ-CLI-cli.md',
        code: 'CLI',
        requirementIds: ['CLI-1'],
      }),
    ];

    vi.mocked(collectFiles).mockResolvedValue([]);

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes[0]?.scope).toBe('');
  });

  test('ignores spec files without a code', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile({
        filePath: '.awa/specs/ARCHITECTURE.md',
        code: '',
        requirementIds: [],
      }),
    ];

    const result = await scanCodes(specFiles, ['.awa/specs/FEAT-*.md'], []);

    expect(result.codes).toHaveLength(0);
  });
});

describe('extractFirstParagraph', () => {
  test('extracts first paragraph after first ## heading', () => {
    const content = '# Title\n\n## Problem\n\nThis is the summary.\n\n## Next\n';
    expect(extractFirstParagraph(content)).toBe('This is the summary.');
  });

  test('joins multi-line paragraphs', () => {
    const content = '# Title\n\n## Problem\n\nLine one\nline two\nline three.\n\n## Next\n';
    expect(extractFirstParagraph(content)).toBe('Line one line two line three.');
  });

  test('truncates long paragraphs to 120 chars', () => {
    const longText = 'A'.repeat(150);
    const content = `# Title\n\n## Problem\n\n${longText}\n\n## Next\n`;
    const result = extractFirstParagraph(content);
    expect(result.length).toBe(120);
    expect(result.endsWith('...')).toBe(true);
  });

  test('returns empty string when no ## heading found', () => {
    const content = '# Title\n\nSome text\n';
    expect(extractFirstParagraph(content)).toBe('');
  });

  test('returns empty string for empty content', () => {
    expect(extractFirstParagraph('')).toBe('');
  });

  test('stops at next heading', () => {
    const content = '# Title\n\n## Problem\n\nFirst paragraph.\n\n### Sub\n\nSecond paragraph.\n';
    expect(extractFirstParagraph(content)).toBe('First paragraph.');
  });
});

describe('extractScopeBoundary', () => {
  test('extracts text from Scope Boundary section', () => {
    const content =
      '# Feature [INFORMATIVE]\n\n## Scope Boundary\n\nScope text here.\n\n## Problem\n\nProblem text.\n';
    expect(extractScopeBoundary(content)).toBe('Scope text here.');
  });

  test('returns empty when no Scope Boundary section', () => {
    const content = '# Feature [INFORMATIVE]\n\n## Problem\n\nProblem text.\n';
    expect(extractScopeBoundary(content)).toBe('');
  });

  test('joins multi-line scope boundary', () => {
    const content =
      '# Feature [INFORMATIVE]\n\n## Scope Boundary\n\nLine one\nline two.\n\n## Problem\n';
    expect(extractScopeBoundary(content)).toBe('Line one line two.');
  });

  test('truncates long scope boundary to 120 chars', () => {
    const longText = 'B'.repeat(150);
    const content = `# Feature [INFORMATIVE]\n\n## Scope Boundary\n\n${longText}\n\n## Problem\n`;
    const result = extractScopeBoundary(content);
    expect(result.length).toBe(120);
    expect(result.endsWith('...')).toBe(true);
  });
});
