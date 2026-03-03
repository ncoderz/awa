// @awa-test: RCOD-2_AC-1, RCOD-2_AC-2
// @awa-test: RCOD-3_AC-1, RCOD-3_AC-2
// @awa-test: RCOD-4_AC-1, RCOD-4_AC-2, RCOD-4_AC-3, RCOD-4_AC-4

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all dependencies
vi.mock('../../core/trace/scanner.js');
vi.mock('../../core/recode/map-builder.js');
vi.mock('../../core/renumber/propagator.js');
vi.mock('../../core/recode/reporter.js');
vi.mock('../../core/merge/spec-mover.js');
vi.mock('../../core/check/codes-fixer.js');
vi.mock('../../utils/logger.js');

import { fixCodesTable } from '../../core/check/codes-fixer.js';
import {
  detectConflicts,
  executeRenames,
  findStaleRefs,
  planRenames,
} from '../../core/merge/spec-mover.js';
import { buildRecodeMap } from '../../core/recode/map-builder.js';
import { formatJson, formatText } from '../../core/recode/reporter.js';
import { propagate } from '../../core/renumber/propagator.js';
import { scan } from '../../core/trace/scanner.js';
import { logger } from '../../utils/logger.js';
import { recodeCommand } from '../recode.js';

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

  vi.mocked(planRenames).mockReturnValue([
    {
      oldPath: '.awa/specs/REQ-SRC-feature.md',
      newPath: '.awa/specs/REQ-TGT-feature.md',
    },
  ]);
  vi.mocked(detectConflicts).mockReturnValue([]);
  vi.mocked(executeRenames).mockResolvedValue([
    {
      oldPath: '.awa/specs/REQ-SRC-feature.md',
      newPath: '.awa/specs/REQ-TGT-feature.md',
    },
  ]);
  vi.mocked(findStaleRefs).mockResolvedValue([]);

  vi.mocked(formatText).mockReturnValue('SRC → TGT: 1 ID(s) recoded');
  vi.mocked(formatJson).mockReturnValue('{"sourceCode":"SRC"}');

  vi.mocked(fixCodesTable).mockResolvedValue(undefined as never);

  return { specs };
}

describe('recodeCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  // @awa-test: RCOD-4_AC-1
  it('recodes source to target and returns exit code 1', async () => {
    mockDefaults();

    const exitCode = await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(1);
    expect(buildRecodeMap).toHaveBeenCalledWith('SRC', 'TGT', expect.anything());
    expect(propagate).toHaveBeenCalled();
    expect(planRenames).toHaveBeenCalled();
    expect(executeRenames).toHaveBeenCalled();
    expect(formatText).toHaveBeenCalled();
  });

  // @awa-test: RCOD-4_AC-4
  it('returns exit code 0 when no changes needed', async () => {
    mockDefaults();
    vi.mocked(buildRecodeMap).mockReturnValue({
      map: { code: 'SRC', entries: new Map() },
      noChange: true,
    });
    vi.mocked(planRenames).mockReturnValue([]);

    const exitCode = await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(0);
    expect(propagate).not.toHaveBeenCalled();
  });

  // @awa-test: RCOD-4_AC-2
  it('passes dryRun to propagator and executeRenames', async () => {
    mockDefaults();

    await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
      dryRun: true,
    });

    expect(propagate).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      true
    );
    expect(executeRenames).toHaveBeenCalledWith(expect.anything(), 'SRC', 'TGT', true);
  });

  // @awa-test: RCOD-4_AC-3
  it('outputs JSON when --json specified', async () => {
    mockDefaults();

    await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
      json: true,
    });

    expect(formatJson).toHaveBeenCalled();
    expect(process.stdout.write).toHaveBeenCalled();
  });

  // @awa-test: RCOD-3_AC-1
  it('returns exit code 2 when source code not found', async () => {
    mockDefaults();
    const { RecodeError } = await import('../../core/recode/types.js');
    vi.mocked(buildRecodeMap).mockImplementation(() => {
      throw new RecodeError('SOURCE_NOT_FOUND', 'No REQ file found for source code: NOPE');
    });

    const exitCode = await recodeCommand({
      sourceCode: 'NOPE',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(2);
    expect(logger.error).toHaveBeenCalledWith('No REQ file found for source code: NOPE');
  });

  // @awa-test: RCOD-3_AC-2
  it('returns exit code 2 when target code not found', async () => {
    mockDefaults();
    const { RecodeError } = await import('../../core/recode/types.js');
    vi.mocked(buildRecodeMap).mockImplementation(() => {
      throw new RecodeError('TARGET_NOT_FOUND', 'No REQ file found for target code: NOPE');
    });

    const exitCode = await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'NOPE',
    });

    expect(exitCode).toBe(2);
    expect(logger.error).toHaveBeenCalledWith('No REQ file found for target code: NOPE');
  });

  it('returns exit code 2 when rename conflict detected', async () => {
    mockDefaults();
    vi.mocked(detectConflicts).mockReturnValue(['.awa/specs/REQ-TGT-feature.md']);

    const exitCode = await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(2);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('conflict'));
  });

  it('returns exit code 2 when stale references found', async () => {
    mockDefaults();
    vi.mocked(findStaleRefs).mockResolvedValue(['.awa/specs/REQ-OTHER-feature.md']);

    const exitCode = await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(2);
  });

  it('calls fixCodesTable after successful recode', async () => {
    mockDefaults();

    await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(scan).toHaveBeenCalledTimes(2);
    expect(fixCodesTable).toHaveBeenCalled();
  });

  it('skips fixCodesTable in dry-run mode', async () => {
    mockDefaults();

    await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
      dryRun: true,
    });

    expect(scan).toHaveBeenCalledTimes(1);
    expect(fixCodesTable).not.toHaveBeenCalled();
  });

  it('returns exit code 2 on unexpected error', async () => {
    mockDefaults();
    vi.mocked(scan).mockRejectedValue(new Error('scan failed'));

    const exitCode = await recodeCommand({
      sourceCode: 'SRC',
      targetCode: 'TGT',
    });

    expect(exitCode).toBe(2);
  });
});
