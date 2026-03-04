import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SpecFile } from '../../check/types.js';
import { executeMoves, resolveMovePath, updateHeading } from '../content-merger.js';

// Mock fs operations
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  rename: vi.fn(),
}));

import { readFile, rename, writeFile } from 'node:fs/promises';

// --- Helpers ---

function makeSpecFile(filePath: string, code: string): SpecFile {
  return {
    filePath,
    code,
    requirementIds: [],
    acIds: [],
    propertyIds: [],
    componentNames: [],
    crossRefs: [],
  };
}

describe('resolveMovePath', () => {
  it('replaces only the code in the filename', () => {
    const result = resolveMovePath(
      '.awa/specs/REQ-SRC-source.md',
      'REQ',
      'SRC',
      'TGT',
      new Set(),
      new Set()
    );
    expect(result).toBe('.awa/specs/REQ-TGT-source.md');
  });

  it('preserves the feature name when no conflict', () => {
    const result = resolveMovePath(
      '.awa/specs/FEAT-CHK-check.md',
      'FEAT',
      'CHK',
      'CLI',
      new Set(),
      new Set()
    );
    expect(result).toBe('.awa/specs/FEAT-CLI-check.md');
  });

  it('adds -001 suffix when target path already exists', () => {
    const existing = new Set(['.awa/specs/REQ-CLI-check.md']);
    const result = resolveMovePath(
      '.awa/specs/REQ-CHK-check.md',
      'REQ',
      'CHK',
      'CLI',
      existing,
      new Set()
    );
    expect(result).toBe('.awa/specs/REQ-CLI-check-001.md');
  });

  it('adds -002 suffix when -001 also conflicts', () => {
    const existing = new Set(['.awa/specs/REQ-CLI-check.md', '.awa/specs/REQ-CLI-check-001.md']);
    const result = resolveMovePath(
      '.awa/specs/REQ-CHK-check.md',
      'REQ',
      'CHK',
      'CLI',
      existing,
      new Set()
    );
    expect(result).toBe('.awa/specs/REQ-CLI-check-002.md');
  });

  it('avoids conflicts with already-planned paths', () => {
    const planned = new Set(['.awa/specs/REQ-CLI-check.md']);
    const result = resolveMovePath(
      '.awa/specs/REQ-CHK-check.md',
      'REQ',
      'CHK',
      'CLI',
      new Set(),
      planned
    );
    expect(result).toBe('.awa/specs/REQ-CLI-check-001.md');
  });

  it('preserves numbered suffix for TASK files', () => {
    const result = resolveMovePath(
      '.awa/tasks/TASK-CHK-check-001.md',
      'TASK',
      'CHK',
      'CLI',
      new Set(),
      new Set()
    );
    expect(result).toBe('.awa/tasks/TASK-CLI-check-001.md');
  });

  it('resolves conflict on numbered TASK file', () => {
    const existing = new Set(['.awa/tasks/TASK-CLI-check-001.md']);
    const result = resolveMovePath(
      '.awa/tasks/TASK-CHK-check-001.md',
      'TASK',
      'CHK',
      'CLI',
      existing,
      new Set()
    );
    expect(result).toBe('.awa/tasks/TASK-CLI-check-001-001.md');
  });
});

describe('updateHeading', () => {
  it('replaces source code in H1 heading', () => {
    const content = '# CHK Check Requirements\n\nSome body text with CHK-1.';
    const result = updateHeading(content, 'CHK', 'CLI');
    expect(result).toBe('# CLI Check Requirements\n\nSome body text with CHK-1.');
  });

  it('does not modify content below the heading', () => {
    const content = '# CHK Feature\n\n## CHK Details\n\nCHK-1 is important.';
    const result = updateHeading(content, 'CHK', 'CLI');
    expect(result.startsWith('# CLI Feature')).toBe(true);
    expect(result).toContain('## CHK Details');
  });

  it('returns content unchanged if no H1 heading', () => {
    const content = 'No heading here.\n\nJust text.';
    const result = updateHeading(content, 'CHK', 'CLI');
    expect(result).toBe(content);
  });
});

describe('executeMoves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renames source file to target code namespace', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    vi.mocked(readFile).mockResolvedValueOnce('# SRC Source\n\nSRC content');
    vi.mocked(rename).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const moves = await executeMoves('SRC', 'TGT', specFiles, false);

    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({
      sourceFile: '.awa/specs/REQ-SRC-source.md',
      targetFile: '.awa/specs/REQ-TGT-source.md',
      docType: 'REQ',
    });

    expect(rename).toHaveBeenCalledWith(
      '.awa/specs/REQ-SRC-source.md',
      '.awa/specs/REQ-TGT-source.md'
    );
    // Heading updated: SRC → TGT
    expect(writeFile).toHaveBeenCalledWith(
      '.awa/specs/REQ-TGT-source.md',
      '# TGT Source\n\nSRC content',
      'utf-8'
    );
  });

  it('adds index suffix when target path clashes', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-SRC-target.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    vi.mocked(readFile).mockResolvedValueOnce('# SRC Target\n\ncontent');
    vi.mocked(rename).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const moves = await executeMoves('SRC', 'TGT', specFiles, false);

    expect(moves).toHaveLength(1);
    expect(moves[0]?.targetFile).toBe('.awa/specs/REQ-TGT-target-001.md');
  });

  it('skips file operations in dry-run mode', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    const moves = await executeMoves('SRC', 'TGT', specFiles, true);

    expect(moves).toHaveLength(1);
    expect(readFile).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('handles multiple file types', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/FEAT-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/DESIGN-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/FEAT-TGT-target.md', 'TGT'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    vi.mocked(readFile)
      .mockResolvedValueOnce('# SRC FEAT\ncontent')
      .mockResolvedValueOnce('# SRC REQ\ncontent')
      .mockResolvedValueOnce('# SRC DESIGN\ncontent');
    vi.mocked(rename).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const moves = await executeMoves('SRC', 'TGT', specFiles, false);

    expect(moves).toHaveLength(3);
    expect(moves.map((m) => m.docType).sort()).toEqual(['DESIGN', 'FEAT', 'REQ']);

    // All should be renames with source feature name preserved
    expect(moves.find((m) => m.docType === 'FEAT')?.targetFile).toBe(
      '.awa/specs/FEAT-TGT-source.md'
    );
    expect(moves.find((m) => m.docType === 'REQ')?.targetFile).toBe('.awa/specs/REQ-TGT-source.md');
    expect(moves.find((m) => m.docType === 'DESIGN')?.targetFile).toBe(
      '.awa/specs/DESIGN-TGT-source.md'
    );
  });

  it('includes TASK files in moves', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/tasks/TASK-SRC-source-001.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    const moves = await executeMoves('SRC', 'TGT', specFiles, true);

    expect(moves).toHaveLength(1);
    expect(moves[0]?.docType).toBe('TASK');
    expect(moves[0]?.targetFile).toBe('.awa/tasks/TASK-TGT-source-001.md');
  });

  it('ignores files from unrelated codes', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
      makeSpecFile('.awa/specs/REQ-OTHER-other.md', 'OTHER'),
    ];

    const moves = await executeMoves('SRC', 'TGT', specFiles, true);

    expect(moves).toHaveLength(1);
    expect(moves[0]?.sourceFile).toBe('.awa/specs/REQ-SRC-source.md');
  });

  it('returns empty when source has no spec files', async () => {
    const specFiles: SpecFile[] = [makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT')];

    const moves = await executeMoves('SRC', 'TGT', specFiles, true);
    expect(moves).toHaveLength(0);
  });

  it('does not write when heading is unchanged', async () => {
    const specFiles: SpecFile[] = [makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC')];

    // No SRC in heading
    vi.mocked(readFile).mockResolvedValueOnce('# Some Title\n\ncontent');
    vi.mocked(rename).mockResolvedValue(undefined);

    await executeMoves('SRC', 'TGT', specFiles, false);

    expect(rename).toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });
});
