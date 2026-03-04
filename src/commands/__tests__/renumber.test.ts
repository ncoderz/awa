// @awa-test: RENUM_P-6
// @awa-test: RENUM-9_AC-1, RENUM-9_AC-2, RENUM-9_AC-3, RENUM-9_AC-4
// @awa-test: RENUM-10_AC-1
// @awa-test: RENUM-8_AC-1, RENUM-8_AC-2

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all dependencies
vi.mock('../../core/trace/scanner.js');
vi.mock('../../core/renumber/map-builder.js');
vi.mock('../../core/renumber/propagator.js');
vi.mock('../../core/renumber/malformed-detector.js');
vi.mock('../../core/renumber/reporter.js');
vi.mock('../../utils/logger.js');

import { correctMalformed, detectMalformed } from '../../core/renumber/malformed-detector.js';
import { buildRenumberMap } from '../../core/renumber/map-builder.js';
import { propagate } from '../../core/renumber/propagator.js';
import { formatJson, formatText } from '../../core/renumber/reporter.js';
import { scan } from '../../core/trace/scanner.js';
import { logger } from '../../utils/logger.js';
import { renumberCommand } from '../renumber.js';

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
  const specs = makeSpecs([{ filePath: '.awa/specs/REQ-FOO-feature.md', code: 'FOO' }]);
  vi.mocked(scan).mockResolvedValue({
    markers: { markers: [], findings: [] },
    specs,
    config: {} as never,
  });
  vi.mocked(buildRenumberMap).mockReturnValue({
    map: { code: 'FOO', entries: new Map() },
    noChange: true,
  });
  vi.mocked(propagate).mockResolvedValue({
    affectedFiles: [],
    totalReplacements: 0,
  });
  vi.mocked(detectMalformed).mockReturnValue([]);
  vi.mocked(correctMalformed).mockResolvedValue({
    corrections: [],
    remainingWarnings: [],
  });
  vi.mocked(formatText).mockReturnValue('no changes');
  vi.mocked(formatJson).mockReturnValue('{}');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDefaults();
});

describe('renumberCommand', () => {
  // @awa-test: RENUM-9_AC-3
  it('returns exit code 2 when no code and no --all', async () => {
    const exitCode = await renumberCommand({});
    expect(exitCode).toBe(2);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      expect.stringContaining('No feature code'),
    );
  });

  // @awa-test: RENUM-9_AC-1, RENUM-10_AC-1
  it('returns exit code 0 when no changes needed', async () => {
    const exitCode = await renumberCommand({ code: 'FOO' });
    expect(exitCode).toBe(0);
  });

  // @awa-test: RENUM-10_AC-1
  it('returns exit code 1 when changes applied', async () => {
    vi.mocked(buildRenumberMap).mockReturnValue({
      map: { code: 'FOO', entries: new Map([['FOO-3', 'FOO-1']]) },
      noChange: false,
    });
    vi.mocked(propagate).mockResolvedValue({
      affectedFiles: [
        { filePath: 'test.md', replacements: [{ line: 1, oldId: 'FOO-3', newId: 'FOO-1' }] },
      ],
      totalReplacements: 1,
    });

    const exitCode = await renumberCommand({ code: 'FOO' });
    expect(exitCode).toBe(1);
  });

  // @awa-test: RENUM-9_AC-4
  it('returns exit code 2 when feature code not found', async () => {
    const { RenumberError } = await import('../../core/renumber/types.js');
    vi.mocked(buildRenumberMap).mockImplementation(() => {
      throw new RenumberError('CODE_NOT_FOUND', 'No REQ file found for feature code: NOPE');
    });

    const exitCode = await renumberCommand({ code: 'NOPE' });
    expect(exitCode).toBe(2);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      expect.stringContaining('No REQ file found'),
    );
  });

  it('calls formatJson when --json is specified', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await renumberCommand({ code: 'FOO', json: true });

    expect(vi.mocked(formatJson)).toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it('calls formatText when --json is not specified', async () => {
    await renumberCommand({ code: 'FOO' });
    expect(vi.mocked(formatText)).toHaveBeenCalled();
  });

  it('passes dryRun to propagate', async () => {
    vi.mocked(buildRenumberMap).mockReturnValue({
      map: { code: 'FOO', entries: new Map([['FOO-3', 'FOO-1']]) },
      noChange: false,
    });

    await renumberCommand({ code: 'FOO', dryRun: true });

    expect(vi.mocked(propagate)).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      true,
    );
  });

  // @awa-test: RENUM-8_AC-1
  it('discovers and renumbers all codes with --all', async () => {
    const specs = makeSpecs([
      { filePath: '.awa/specs/REQ-AAA-feature.md', code: 'AAA' },
      { filePath: '.awa/specs/REQ-BBB-feature.md', code: 'BBB' },
    ]);
    vi.mocked(scan).mockResolvedValue({
      markers: { markers: [], findings: [] },
      specs,
      config: {} as never,
    });
    vi.mocked(buildRenumberMap).mockReturnValue({
      map: { code: 'AAA', entries: new Map() },
      noChange: true,
    });

    const exitCode = await renumberCommand({ all: true });

    expect(exitCode).toBe(0);
    // buildRenumberMap called for each discovered code
    expect(vi.mocked(buildRenumberMap)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(buildRenumberMap)).toHaveBeenCalledWith('AAA', expect.anything());
    expect(vi.mocked(buildRenumberMap)).toHaveBeenCalledWith('BBB', expect.anything());
  });

  // @awa-test: RENUM-8_AC-2
  it('renumbers each code independently with --all', async () => {
    const specs = makeSpecs([
      { filePath: '.awa/specs/REQ-AAA-feature.md', code: 'AAA' },
      { filePath: '.awa/specs/REQ-BBB-feature.md', code: 'BBB' },
    ]);
    vi.mocked(scan).mockResolvedValue({
      markers: { markers: [], findings: [] },
      specs,
      config: {} as never,
    });

    // AAA has changes, BBB doesn't
    vi.mocked(buildRenumberMap)
      .mockReturnValueOnce({
        map: { code: 'AAA', entries: new Map([['AAA-3', 'AAA-1']]) },
        noChange: false,
      })
      .mockReturnValueOnce({
        map: { code: 'BBB', entries: new Map() },
        noChange: true,
      });
    vi.mocked(propagate).mockResolvedValue({
      affectedFiles: [],
      totalReplacements: 1,
    });

    const exitCode = await renumberCommand({ all: true });

    expect(exitCode).toBe(1); // AAA had changes
    // Propagate only called for AAA (BBB was no-change)
    expect(vi.mocked(propagate)).toHaveBeenCalledTimes(1);
  });

  // @awa-test: RENUM_P-6
  it('P-6: exit code matches scenario (0=no-change, 1=changes, 2=error)', async () => {
    // Scenario 1: no changes → 0
    vi.mocked(buildRenumberMap).mockReturnValue({
      map: { code: 'FOO', entries: new Map() },
      noChange: true,
    });
    expect(await renumberCommand({ code: 'FOO' })).toBe(0);

    // Scenario 2: changes → 1
    vi.mocked(buildRenumberMap).mockReturnValue({
      map: { code: 'FOO', entries: new Map([['FOO-3', 'FOO-1']]) },
      noChange: false,
    });
    vi.mocked(propagate).mockResolvedValue({ affectedFiles: [], totalReplacements: 1 });
    expect(await renumberCommand({ code: 'FOO' })).toBe(1);

    // Scenario 3: error → 2
    expect(await renumberCommand({})).toBe(2);
  });

  // @awa-test: RENUM-12_AC-3
  it('does not call correctMalformed when flag is off', async () => {
    vi.mocked(buildRenumberMap).mockReturnValue({
      map: { code: 'FOO', entries: new Map([['FOO-3', 'FOO-1']]) },
      noChange: false,
    });
    vi.mocked(detectMalformed).mockReturnValue([
      { filePath: 'test.md', line: 1, token: 'FOO-1_AC-1/2' },
    ]);

    await renumberCommand({ code: 'FOO' });

    expect(vi.mocked(correctMalformed)).not.toHaveBeenCalled();
  });

  it('calls correctMalformed when flag is on and warnings exist', async () => {
    vi.mocked(buildRenumberMap).mockReturnValue({
      map: { code: 'FOO', entries: new Map([['FOO-3', 'FOO-1']]) },
      noChange: false,
    });
    vi.mocked(detectMalformed).mockReturnValue([
      { filePath: 'test.md', line: 1, token: 'FOO-1_AC-1/2' },
    ]);
    vi.mocked(correctMalformed).mockResolvedValue({
      corrections: [
        {
          filePath: 'test.md',
          line: 1,
          token: 'FOO-1_AC-1/2',
          replacement: 'FOO-1_AC-1, FOO-1_AC-2',
        },
      ],
      remainingWarnings: [],
    });

    await renumberCommand({ code: 'FOO', dangerouslyModifyMalformedIds: true });

    expect(vi.mocked(correctMalformed)).toHaveBeenCalledTimes(1);
  });

  it('does not call correctMalformed when flag is on but no warnings', async () => {
    vi.mocked(buildRenumberMap).mockReturnValue({
      map: { code: 'FOO', entries: new Map([['FOO-3', 'FOO-1']]) },
      noChange: false,
    });
    vi.mocked(detectMalformed).mockReturnValue([]);

    await renumberCommand({ code: 'FOO', dangerouslyModifyMalformedIds: true });

    expect(vi.mocked(correctMalformed)).not.toHaveBeenCalled();
  });
});
