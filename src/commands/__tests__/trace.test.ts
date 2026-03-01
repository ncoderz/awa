// @awa-test: TRC-8_AC-1, TRC-8_AC-2, TRC-2_AC-4, TRC-5_AC-5

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { TraceCommandOptions, TraceIndex, TraceResult } from '../../core/trace/types.js';

// Mock all trace dependencies
vi.mock('../../core/trace/scanner.js');
vi.mock('../../core/trace/index-builder.js');
vi.mock('../../core/trace/input-resolver.js');
vi.mock('../../core/trace/resolver.js');
vi.mock('../../core/trace/formatter.js');
vi.mock('../../core/trace/content-assembler.js');
vi.mock('../../core/trace/content-formatter.js');
vi.mock('../../core/trace/token-estimator.js');
vi.mock('../../utils/logger.js');

import { assembleContent } from '../../core/trace/content-assembler.js';
import { formatContentMarkdown } from '../../core/trace/content-formatter.js';
import { formatJson, formatList, formatTree } from '../../core/trace/formatter.js';
import { buildTraceIndex } from '../../core/trace/index-builder.js';
import { resolveIds } from '../../core/trace/input-resolver.js';
import { resolveTrace } from '../../core/trace/resolver.js';
import { scan } from '../../core/trace/scanner.js';
import { logger } from '../../utils/logger.js';
import { traceCommand } from '../trace.js';

/** Default options — all required fields set to sensible defaults. */
const defaults: TraceCommandOptions = {
  ids: [],
  content: false,
  list: false,
  json: false,
  direction: 'both',
};

/** Build options from partial overrides. */
function opts(overrides: Partial<TraceCommandOptions>): TraceCommandOptions {
  return { ...defaults, ...overrides };
}

/** Minimal index with allIds */
function makeIndex(ids: string[]): TraceIndex {
  return {
    reqToACs: new Map(),
    acToDesignComponents: new Map(),
    acToCodeLocations: new Map(),
    acToTestLocations: new Map(),
    propertyToTestLocations: new Map(),
    componentToCodeLocations: new Map(),
    acToReq: new Map(),
    componentToACs: new Map(),
    propertyToACs: new Map(),
    idLocations: new Map(),
    allIds: new Set(ids),
  };
}

const foundResult: TraceResult = {
  chains: [
    {
      queryId: 'DIFF-1_AC-1',
      requirement: undefined,
      acs: [],
      designComponents: [],
      implementations: [],
      tests: [],
      properties: [],
    },
  ],
  notFound: [],
};

describe('traceCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(scan).mockResolvedValue({
      markers: { markers: [], findings: [] },
      specs: {
        requirementIds: new Set(),
        acIds: new Set(),
        propertyIds: new Set(),
        componentNames: new Set(),
        allIds: new Set(),
        specFiles: [],
        idLocations: new Map(),
      },
      config: {} as never,
    });
    vi.mocked(buildTraceIndex).mockReturnValue(makeIndex(['DIFF-1', 'DIFF-1_AC-1']));
    vi.mocked(resolveIds).mockReturnValue({ ids: ['DIFF-1_AC-1'], warnings: [] });
    vi.mocked(resolveTrace).mockReturnValue(foundResult);
    vi.mocked(formatTree).mockReturnValue('tree output\n');
    vi.mocked(formatList).mockReturnValue('list output\n');
    vi.mocked(formatJson).mockReturnValue('{}');
    vi.mocked(assembleContent).mockResolvedValue([]);
    vi.mocked(formatContentMarkdown).mockReturnValue('# Content\n');

    // Suppress stdout during tests
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  // @awa-test: TRC-8_AC-1
  test('accepts IDs as positional arguments and outputs tree by default', async () => {
    const code = await traceCommand(opts({ ids: ['DIFF-1_AC-1'] }));

    expect(code).toBe(0);
    expect(resolveIds).toHaveBeenCalledWith(['DIFF-1_AC-1'], expect.anything());
    expect(formatTree).toHaveBeenCalled();
  });

  // @awa-test: TRC-8_AC-1
  test('supports --list option', async () => {
    const code = await traceCommand(opts({ ids: ['DIFF-1_AC-1'], list: true }));

    expect(code).toBe(0);
    expect(formatList).toHaveBeenCalled();
  });

  // @awa-test: TRC-8_AC-1
  test('supports --json option', async () => {
    const code = await traceCommand(opts({ ids: ['DIFF-1_AC-1'], json: true }));

    expect(code).toBe(0);
    expect(formatJson).toHaveBeenCalled();
  });

  // @awa-test: TRC-8_AC-1
  test('supports --content option', async () => {
    const code = await traceCommand(opts({ ids: ['DIFF-1_AC-1'], content: true }));

    expect(code).toBe(0);
    expect(assembleContent).toHaveBeenCalled();
  });

  // @awa-test: TRC-8_AC-2
  test('returns exit code 0 when chains are found', async () => {
    const code = await traceCommand(opts({ ids: ['DIFF-1_AC-1'] }));

    expect(code).toBe(0);
  });

  // @awa-test: TRC-8_AC-2
  test('returns exit code 1 when no IDs provided', async () => {
    const code = await traceCommand(opts({}));

    expect(code).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('No IDs'));
  });

  // @awa-test: TRC-8_AC-2
  test('returns exit code 1 when no valid IDs found', async () => {
    vi.mocked(resolveIds).mockReturnValue({ ids: [], warnings: ['not found'] });

    const code = await traceCommand(opts({ ids: ['NOPE-99'] }));

    expect(code).toBe(1);
  });

  // @awa-test: TRC-8_AC-2
  test('returns exit code 2 on internal error', async () => {
    vi.mocked(scan).mockRejectedValue(new Error('scan failed'));

    const code = await traceCommand(opts({ ids: ['DIFF-1'] }));

    expect(code).toBe(2);
    expect(logger.error).toHaveBeenCalledWith('scan failed');
  });

  // @awa-test: TRC-2_AC-4
  test('--all resolves every known ID in the index', async () => {
    const index = makeIndex(['DIFF-1', 'DIFF-1_AC-1', 'DIFF_P-1']);
    vi.mocked(buildTraceIndex).mockReturnValue(index);

    const code = await traceCommand(opts({ all: true }));

    expect(code).toBe(0);
    expect(resolveTrace).toHaveBeenCalledWith(
      index,
      expect.arrayContaining(['DIFF-1', 'DIFF-1_AC-1', 'DIFF_P-1']),
      expect.anything()
    );
    expect(resolveIds).not.toHaveBeenCalled();
  });

  // @awa-test: TRC-5_AC-5
  test('context line options are silently ignored without --content', async () => {
    const code = await traceCommand(
      opts({ ids: ['DIFF-1_AC-1'], beforeContext: 10, afterContext: 20 })
    );

    expect(code).toBe(0);
    expect(formatTree).toHaveBeenCalled();
    expect(assembleContent).not.toHaveBeenCalled();
  });

  // @awa-test: TRC-5_AC-5
  test('context line options are passed when --content is active', async () => {
    const code = await traceCommand(
      opts({ ids: ['DIFF-1_AC-1'], content: true, beforeContext: 10, afterContext: 3 })
    );

    expect(code).toBe(0);
    expect(assembleContent).toHaveBeenCalledWith(expect.anything(), undefined, {
      beforeContext: 10,
      afterContext: 3,
    });
  });
});
