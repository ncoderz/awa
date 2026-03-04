import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all dependencies
vi.mock('../../core/trace/scanner.js');
vi.mock('../../core/recode/map-builder.js');
vi.mock('../../core/renumber/propagator.js');
vi.mock('../../core/merge/content-merger.js');
vi.mock('../../core/merge/spec-mover.js');
vi.mock('../../core/merge/reporter.js');
vi.mock('../../core/check/codes-fixer.js');
vi.mock('../../utils/logger.js');

import { fixCodesTable } from '../../core/check/codes-fixer.js';
import { executeMoves } from '../../core/merge/content-merger.js';
import { formatJson, formatText } from '../../core/merge/reporter.js';
import { findStaleRefs, validateMerge } from '../../core/merge/spec-mover.js';
import { MergeError } from '../../core/merge/types.js';
import { buildRecodeMap, hasAnySpecFile } from '../../core/recode/map-builder.js';
import { propagate } from '../../core/renumber/propagator.js';
import { scan } from '../../core/trace/scanner.js';
import { logger } from '../../utils/logger.js';
import { mergeCommand } from '../merge.js';

// --- Helpers ---

function makeSpecs(specFiles: { filePath: string; code: string }[]) {
  return {
    requirementIds: new Set<string>(),
    acIds: new Set<string>(),
    propertyIds: new Set<string>(),
    componentNames: new Set<string>(),
    allIds: new Set<string>(),
    specFiles: specFiles.map((sf) => ({
      filePath: sf.filePath,
      code: sf.code,
      requirementIds: [] as string[],
      acIds: [] as string[],
      propertyIds: [] as string[],
      componentNames: [] as string[],
      crossRefs: [],
    })),
    idLocations: new Map(),
  };
}

function mockDefaults() {
  const specs = makeSpecs([
    { filePath: '.awa/specs/REQ-SRC-feature.md', code: 'SRC' },
    { filePath: '.awa/specs/REQ-TGT-feature.md', code: 'TGT' },
    { filePath: '.awa/specs/DESIGN-SRC-feature.md', code: 'SRC' },
  ]);
  vi.mocked(scan).mockResolvedValue({
    markers: { markers: [], findings: [] },
    specs,
    config: {} as never,
  });

  const entries = new Map([['SRC-1', 'TGT-3']]);
  vi.mocked(buildRecodeMap).mockReturnValue({
    map: { code: 'SRC', entries },
    noChange: false,
  });

  vi.mocked(propagate).mockResolvedValue({
    affectedFiles: [
      { filePath: 'file.ts', replacements: [{ line: 1, oldId: 'SRC-1', newId: 'TGT-3' }] },
    ],
    totalReplacements: 1,
  });

  vi.mocked(executeMoves).mockResolvedValue([
    {
      sourceFile: '.awa/specs/REQ-SRC-feature.md',
      targetFile: '.awa/specs/REQ-TGT-feature.md',
      docType: 'REQ',
    },
    {
      sourceFile: '.awa/specs/DESIGN-SRC-feature.md',
      targetFile: '.awa/specs/DESIGN-TGT-feature.md',
      docType: 'DESIGN',
    },
  ]);

  vi.mocked(findStaleRefs).mockResolvedValue([]);

  vi.mocked(validateMerge).mockImplementation((src, tgt) => {
    if (src === tgt) {
      throw new MergeError('SELF_MERGE', `Cannot merge a code into itself: ${src}`);
    }
  });

  vi.mocked(formatText).mockReturnValue('SRC → TGT: 1 ID(s) recoded');
  vi.mocked(formatJson).mockReturnValue('{"sourceCode":"SRC"}');

  vi.mocked(fixCodesTable).mockResolvedValue(undefined as never);

  vi.mocked(hasAnySpecFile).mockReturnValue(true);

  return { specs };
}

describe('mergeCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  it('merges source to target and returns exit code 1', async () => {
    mockDefaults();

    const exitCode = await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(1);
    expect(buildRecodeMap).toHaveBeenCalledWith('SRC', 'TGT', expect.anything());
    expect(propagate).toHaveBeenCalled();
    expect(executeMoves).toHaveBeenCalledWith('SRC', 'TGT', expect.anything(), false);
    expect(formatText).toHaveBeenCalled();
  });

  it('returns exit code 0 when no changes needed', async () => {
    mockDefaults();
    vi.mocked(buildRecodeMap).mockReturnValue({
      map: { code: 'SRC', entries: new Map() },
      noChange: true,
    });
    vi.mocked(executeMoves).mockResolvedValue([]);

    const exitCode = await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(0);
    expect(propagate).not.toHaveBeenCalled();
  });

  it('passes dryRun to propagator and executeAppends', async () => {
    mockDefaults();

    await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
      dryRun: true,
    });

    expect(propagate).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      true,
    );
    expect(executeMoves).toHaveBeenCalledWith('SRC', 'TGT', expect.anything(), true);
  });

  it('outputs JSON when --json specified', async () => {
    mockDefaults();

    await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
      json: true,
    });

    expect(formatJson).toHaveBeenCalled();
    expect(process.stdout.write).toHaveBeenCalled();
  });

  it('returns exit code 2 when merging code into itself', async () => {
    mockDefaults();

    const exitCode = await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'SRC',
    });

    expect(exitCode).toBe(2);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Cannot merge'));
  });

  it('returns exit code 2 when source code not found', async () => {
    mockDefaults();
    const { RecodeError } = await import('../../core/recode/types.js');
    vi.mocked(buildRecodeMap).mockImplementation(() => {
      throw new RecodeError('SOURCE_NOT_FOUND', 'No REQ file found for source code: NOPE');
    });

    const exitCode = await mergeCommand({
      sourceCode: 'NOPE',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(2);
    expect(logger.error).toHaveBeenCalledWith('No REQ file found for source code: NOPE');
  });

  it('returns exit code 2 when target code has no spec files', async () => {
    mockDefaults();
    vi.mocked(hasAnySpecFile).mockReturnValue(false);

    const exitCode = await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'NOPE',
    });

    expect(exitCode).toBe(2);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('No spec files found for target code: NOPE'),
    );
  });

  it('reports moved files in result', async () => {
    mockDefaults();

    await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(formatText).toHaveBeenCalledWith(
      expect.objectContaining({
        moves: [
          expect.objectContaining({
            sourceFile: '.awa/specs/REQ-SRC-feature.md',
            targetFile: '.awa/specs/REQ-TGT-feature.md',
            docType: 'REQ',
          }),
          expect.objectContaining({
            sourceFile: '.awa/specs/DESIGN-SRC-feature.md',
            targetFile: '.awa/specs/DESIGN-TGT-feature.md',
            docType: 'DESIGN',
          }),
        ],
      }),
      false,
    );
  });

  it('returns exit code 2 on unexpected error', async () => {
    mockDefaults();
    vi.mocked(scan).mockRejectedValue(new Error('scan failed'));

    const exitCode = await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(2);
  });

  it('returns exit code 2 when stale references found', async () => {
    mockDefaults();
    vi.mocked(findStaleRefs).mockResolvedValue(['.awa/specs/REQ-OTHER-feature.md']);

    const exitCode = await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(2);
    expect(formatText).toHaveBeenCalledWith(
      expect.objectContaining({ staleRefs: ['.awa/specs/REQ-OTHER-feature.md'] }),
      false,
    );
  });

  it('calls fixCodesTable after successful merge', async () => {
    mockDefaults();

    await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    // scan() is called twice: once at start, once to refresh specs for fixCodesTable
    expect(scan).toHaveBeenCalledTimes(2);
    expect(fixCodesTable).toHaveBeenCalled();
  });

  it('skips fixCodesTable in dry-run mode', async () => {
    mockDefaults();

    await mergeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
      dryRun: true,
    });

    // scan() only called once (initial scan), not for fixCodesTable
    expect(scan).toHaveBeenCalledTimes(1);
    expect(fixCodesTable).not.toHaveBeenCalled();
  });
});
