import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock dependencies BEFORE importing the module under test
vi.mock('../../core/trace/scanner.js');
vi.mock('../../core/codes/scanner.js');
vi.mock('../../utils/logger.js');

import { scanCodes } from '../../core/codes/scanner.js';
import type { CodesResult } from '../../core/codes/types.js';
import { scan } from '../../core/trace/scanner.js';
import { logger } from '../../utils/logger.js';
import { codesCommand } from '../codes.js';

const mockResult: CodesResult = {
  codes: [
    {
      code: 'CHK',
      feature: 'check',
      reqCount: 16,
      scope: 'Traceability validation',
      docs: { feat: true, req: true, design: true, api: false, example: false },
    },
    {
      code: 'CLI',
      feature: 'cli',
      reqCount: 15,
      scope: 'Command-line interface',
      docs: { feat: true, req: true, design: false, api: false, example: false },
    },
  ],
};

describe('codesCommand', () => {
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
      config: {
        specGlobs: ['.awa/specs/REQ-*.md'],
        codeGlobs: [],
        specIgnore: [],
        codeIgnore: [],
        ignoreMarkers: [],
        markers: [],
        idPattern: '',
        crossRefPatterns: [],
        format: 'text',
        schemaDir: '',
        schemaEnabled: false,
        allowWarnings: true,
        specOnly: false,
        fix: true,
      },
    });

    vi.mocked(scanCodes).mockResolvedValue(mockResult);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('returns exit code 0 on success', async () => {
    const exitCode = await codesCommand({});

    expect(exitCode).toBe(0);
    expect(scan).toHaveBeenCalled();
    expect(scanCodes).toHaveBeenCalled();
  });

  test('passes config option to scan', async () => {
    await codesCommand({ config: '/custom/path' });

    expect(scan).toHaveBeenCalledWith('/custom/path');
  });

  test('outputs JSON when --json is set', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await codesCommand({ json: true });

    expect(writeSpy).toHaveBeenCalled();
    const output = writeSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.totalCodes).toBe(2);
    expect(parsed.codes[0].code).toBe('CHK');

    writeSpy.mockRestore();
  });

  test('outputs summary when --summary is set', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await codesCommand({ summary: true });

    expect(writeSpy).toHaveBeenCalled();
    const output = writeSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('codes: 2');

    writeSpy.mockRestore();
  });

  test('outputs table by default', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await codesCommand({});

    expect(writeSpy).toHaveBeenCalled();
    const output = writeSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('CHK');
    expect(output).toContain('CLI');

    writeSpy.mockRestore();
  });

  test('returns exit code 2 on error', async () => {
    vi.mocked(scan).mockRejectedValue(new Error('Scan failed'));

    const exitCode = await codesCommand({});

    expect(exitCode).toBe(2);
    expect(logger.error).toHaveBeenCalledWith('Scan failed');
  });
});
