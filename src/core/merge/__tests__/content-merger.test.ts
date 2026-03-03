import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpecFile } from '../../check/types.js';
import { executeAppends, resolveTargetFile } from '../content-merger.js';

// Mock fs operations
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

import { readFile, unlink, writeFile } from 'node:fs/promises';

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

describe('resolveTargetFile', () => {
  it('finds existing target REQ file', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    const result = resolveTargetFile(
      '.awa/specs/REQ-SRC-source.md',
      'REQ',
      'SRC',
      'TGT',
      specFiles
    );

    expect(result).toEqual({
      path: '.awa/specs/REQ-TGT-target.md',
      exists: true,
    });
  });

  it('finds existing target DESIGN file', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/DESIGN-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/DESIGN-TGT-target.md', 'TGT'),
    ];

    const result = resolveTargetFile(
      '.awa/specs/DESIGN-SRC-source.md',
      'DESIGN',
      'SRC',
      'TGT',
      specFiles
    );

    expect(result).toEqual({
      path: '.awa/specs/DESIGN-TGT-target.md',
      exists: true,
    });
  });

  it('finds existing target FEAT file', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/FEAT-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/FEAT-TGT-target.md', 'TGT'),
    ];

    const result = resolveTargetFile(
      '.awa/specs/FEAT-SRC-source.md',
      'FEAT',
      'SRC',
      'TGT',
      specFiles
    );

    expect(result).toEqual({
      path: '.awa/specs/FEAT-TGT-target.md',
      exists: true,
    });
  });

  it('derives target path when no target file exists', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/DESIGN-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    const result = resolveTargetFile(
      '.awa/specs/DESIGN-SRC-source.md',
      'DESIGN',
      'SRC',
      'TGT',
      specFiles
    );

    expect(result).toEqual({
      path: '.awa/specs/DESIGN-TGT-target.md',
      exists: false,
    });
  });

  it('matches EXAMPLE files by sequence number', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/EXAMPLE-SRC-source-001.md', 'SRC'),
      makeSpecFile('.awa/specs/EXAMPLE-TGT-target-001.md', 'TGT'),
      makeSpecFile('.awa/specs/EXAMPLE-TGT-target-002.md', 'TGT'),
    ];

    const result = resolveTargetFile(
      '.awa/specs/EXAMPLE-SRC-source-001.md',
      'EXAMPLE',
      'SRC',
      'TGT',
      specFiles
    );

    expect(result).toEqual({
      path: '.awa/specs/EXAMPLE-TGT-target-001.md',
      exists: true,
    });
  });

  it('derives EXAMPLE path when no matching sequence exists', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/EXAMPLE-SRC-source-003.md', 'SRC'),
      makeSpecFile('.awa/specs/EXAMPLE-TGT-target-001.md', 'TGT'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    const result = resolveTargetFile(
      '.awa/specs/EXAMPLE-SRC-source-003.md',
      'EXAMPLE',
      'SRC',
      'TGT',
      specFiles
    );

    expect(result).toEqual({
      path: '.awa/specs/EXAMPLE-TGT-target-003.md',
      exists: false,
    });
  });

  it('falls back to replacing code in filename when no target feature name', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/DESIGN-SRC-source.md', 'SRC'),
    ];

    const result = resolveTargetFile(
      '.awa/specs/DESIGN-SRC-source.md',
      'DESIGN',
      'SRC',
      'TGT',
      specFiles
    );

    expect(result).toEqual({
      path: '.awa/specs/DESIGN-TGT-source.md',
      exists: false,
    });
  });

  it('handles API (.tsp) files', () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/API-SRC-source.tsp', 'SRC'),
      makeSpecFile('.awa/specs/API-TGT-target.tsp', 'TGT'),
    ];

    const result = resolveTargetFile(
      '.awa/specs/API-SRC-source.tsp',
      'API',
      'SRC',
      'TGT',
      specFiles
    );

    expect(result).toEqual({
      path: '.awa/specs/API-TGT-target.tsp',
      exists: true,
    });
  });
});

describe('executeAppends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends source content to existing target with separator', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    vi.mocked(readFile)
      .mockResolvedValueOnce('# Source\n\nSRC content')
      .mockResolvedValueOnce('# Target\n\nTGT content');
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(unlink).mockResolvedValue(undefined);

    const appends = await executeAppends('SRC', 'TGT', specFiles, false);

    expect(appends).toHaveLength(1);
    expect(appends[0]).toEqual({
      sourceFile: '.awa/specs/REQ-SRC-source.md',
      targetFile: '.awa/specs/REQ-TGT-target.md',
      created: false,
      docType: 'REQ',
    });

    expect(writeFile).toHaveBeenCalledWith(
      '.awa/specs/REQ-TGT-target.md',
      '# Target\n\nTGT content\n\n---\n\n# Source\n\nSRC content',
      'utf-8'
    );
    expect(unlink).toHaveBeenCalledWith('.awa/specs/REQ-SRC-source.md');
  });

  it('creates target file when it does not exist', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/DESIGN-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    vi.mocked(readFile).mockResolvedValueOnce('# Design\n\nDesign content');
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(unlink).mockResolvedValue(undefined);

    const appends = await executeAppends('SRC', 'TGT', specFiles, false);

    expect(appends).toHaveLength(1);
    expect(appends[0]?.created).toBe(true);
    expect(appends[0]?.targetFile).toBe('.awa/specs/DESIGN-TGT-target.md');

    expect(writeFile).toHaveBeenCalledWith(
      '.awa/specs/DESIGN-TGT-target.md',
      '# Design\n\nDesign content',
      'utf-8'
    );
    expect(unlink).toHaveBeenCalledWith('.awa/specs/DESIGN-SRC-source.md');
  });

  it('skips file operations in dry-run mode', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    const appends = await executeAppends('SRC', 'TGT', specFiles, true);

    expect(appends).toHaveLength(1);
    expect(readFile).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
  });

  it('handles multiple file types', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/FEAT-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/DESIGN-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/FEAT-TGT-target.md', 'TGT'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    // 3 source files: FEAT, REQ (append), DESIGN (create)
    // FEAT and REQ: read source + read target
    // DESIGN: read source only (no target)
    vi.mocked(readFile)
      .mockResolvedValueOnce('FEAT source')
      .mockResolvedValueOnce('FEAT target')
      .mockResolvedValueOnce('REQ source')
      .mockResolvedValueOnce('REQ target')
      .mockResolvedValueOnce('DESIGN source');
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(unlink).mockResolvedValue(undefined);

    const appends = await executeAppends('SRC', 'TGT', specFiles, false);

    expect(appends).toHaveLength(3);
    expect(appends.map((a) => a.docType).sort()).toEqual(['DESIGN', 'FEAT', 'REQ']);

    const featAppend = appends.find((a) => a.docType === 'FEAT');
    expect(featAppend?.created).toBe(false);

    const designAppend = appends.find((a) => a.docType === 'DESIGN');
    expect(designAppend?.created).toBe(true);
  });

  it('ignores non-merge file types (e.g. TASK)', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/tasks/TASK-SRC-source-001.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
    ];

    const appends = await executeAppends('SRC', 'TGT', specFiles, true);

    expect(appends).toHaveLength(0);
  });

  it('ignores files from unrelated codes', async () => {
    const specFiles: SpecFile[] = [
      makeSpecFile('.awa/specs/REQ-SRC-source.md', 'SRC'),
      makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT'),
      makeSpecFile('.awa/specs/REQ-OTHER-other.md', 'OTHER'),
    ];

    const appends = await executeAppends('SRC', 'TGT', specFiles, true);

    expect(appends).toHaveLength(1);
    expect(appends[0]?.sourceFile).toBe('.awa/specs/REQ-SRC-source.md');
  });

  it('returns empty when source has no spec files', async () => {
    const specFiles: SpecFile[] = [makeSpecFile('.awa/specs/REQ-TGT-target.md', 'TGT')];

    const appends = await executeAppends('SRC', 'TGT', specFiles, true);
    expect(appends).toHaveLength(0);
  });
});
