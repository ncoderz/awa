// @awa-component: RENUM-RenumberCommand
// @awa-impl: RENUM-8_AC-1, RENUM-8_AC-2
// @awa-impl: RENUM-9_AC-1, RENUM-9_AC-2, RENUM-9_AC-3, RENUM-9_AC-4
// @awa-impl: RENUM-10_AC-1

import { readFile } from 'node:fs/promises';

import { correctMalformed, detectMalformed } from '../core/renumber/malformed-detector.js';
import { buildRenumberMap } from '../core/renumber/map-builder.js';
import { propagate } from '../core/renumber/propagator.js';
import { formatJson, formatText } from '../core/renumber/reporter.js';
import type { RenumberCommandOptions, RenumberResult } from '../core/renumber/types.js';
import { RenumberError } from '../core/renumber/types.js';
import { scan } from '../core/trace/scanner.js';
import { logger } from '../utils/logger.js';

/**
 * Execute the `awa renumber` command.
 * Returns exit code: 0 = no changes needed, 1 = changes applied/previewed, 2 = error.
 */
// @awa-impl: RENUM-10_AC-1
export async function renumberCommand(options: RenumberCommandOptions): Promise<number> {
  try {
    // @awa-impl: RENUM-9_AC-3
    if (!options.code && !options.all) {
      logger.error('No feature code or --all specified');
      return 2;
    }

    const { markers, specs } = await scan(options.config);

    // Determine which codes to renumber
    // @awa-impl: RENUM-8_AC-1
    let codes: string[];
    if (options.all) {
      codes = discoverFeatureCodes(specs.specFiles);
      if (codes.length === 0) {
        logger.warn('No feature codes discovered from REQ files');
        return 0;
      }
    } else {
      codes = [options.code as string];
    }

    const dryRun = options.dryRun === true;
    const fixMalformed = options.dangerouslyModifyMalformedIds === true;
    const results: RenumberResult[] = [];
    let hasChanges = false;

    // @awa-impl: RENUM-8_AC-2
    for (const code of codes) {
      try {
        const result = await runRenumberPipeline(code, specs, markers, dryRun, fixMalformed);
        results.push(result);
        if (!result.noChange) {
          hasChanges = true;
        }
      } catch (err) {
        if (err instanceof RenumberError && err.errorCode === 'CODE_NOT_FOUND') {
          // @awa-impl: RENUM-9_AC-4
          logger.error(err.message);
          return 2;
        }
        throw err;
      }
    }

    // Output results
    if (options.json) {
      // JSON mode: output array if --all, single object otherwise
      if (results.length === 1) {
        const first = results[0] as RenumberResult;
        process.stdout.write(`${formatJson(first)}\n`);
      } else {
        const jsonArray = results.map((r) => JSON.parse(formatJson(r)));
        process.stdout.write(`${JSON.stringify(jsonArray, null, 2)}\n`);
      }
    } else {
      for (const result of results) {
        const text = formatText(result, dryRun);
        logger.info(text);
      }
    }

    // @awa-impl: RENUM-10_AC-1
    return hasChanges ? 1 : 0;
  } catch (err) {
    if (err instanceof RenumberError) {
      logger.error(err.message);
      return 2;
    }
    if (err instanceof Error) {
      logger.error(err.message);
    } else {
      logger.error(String(err));
    }
    return 2;
  }
}

/**
 * Run the renumber pipeline for a single feature code.
 */
// @awa-impl: RENUM-9_AC-1
async function runRenumberPipeline(
  code: string,
  specs: import('../core/check/types.js').SpecParseResult,
  markers: import('../core/check/types.js').MarkerScanResult,
  dryRun: boolean,
  fixMalformed: boolean,
): Promise<RenumberResult> {
  // Build renumber map
  const { map, noChange } = buildRenumberMap(code, specs);

  if (noChange) {
    return {
      code,
      map,
      affectedFiles: [],
      totalReplacements: 0,
      malformedWarnings: [],
      malformedCorrections: [],
      noChange: true,
    };
  }

  // Detect malformed IDs from spec and code files
  const fileContents = await collectFileContents(specs, markers, code);
  const allWarnings = detectMalformed(code, fileContents);

  // Optionally correct unambiguous malformed IDs before propagation
  let malformedWarnings: readonly import('../core/renumber/types.js').MalformedWarning[];
  let malformedCorrections: readonly import('../core/renumber/types.js').MalformedCorrection[];

  if (fixMalformed && allWarnings.length > 0) {
    const result = await correctMalformed(code, allWarnings, fileContents, dryRun);
    malformedCorrections = result.corrections;
    malformedWarnings = result.remainingWarnings;
  } else {
    malformedWarnings = allWarnings;
    malformedCorrections = [];
  }

  // Propagate changes (after corrections so corrected IDs get renumbered)
  const { affectedFiles, totalReplacements } = await propagate(map, specs, markers, dryRun);

  return {
    code,
    map,
    affectedFiles,
    totalReplacements,
    malformedWarnings,
    malformedCorrections,
    noChange: false,
  };
}

/**
 * Discover all feature codes from REQ files.
 */
function discoverFeatureCodes(
  specFiles: readonly import('../core/check/types.js').SpecFile[],
): string[] {
  const codes = new Set<string>();
  for (const sf of specFiles) {
    if (sf.code && /^REQ-/.test(sf.filePath.split('/').pop() ?? '')) {
      codes.add(sf.code);
    }
  }
  return [...codes].sort();
}

/**
 * Collect file contents for malformed detection.
 * Reads spec files and code files that have markers for the given code.
 */
async function collectFileContents(
  specs: import('../core/check/types.js').SpecParseResult,
  markers: import('../core/check/types.js').MarkerScanResult,
  code: string,
): Promise<Map<string, string>> {
  const paths = new Set<string>();

  // Add spec files
  for (const sf of specs.specFiles) {
    paths.add(sf.filePath);
  }

  // Add code files with markers starting with the code prefix
  for (const m of markers.markers) {
    if (m.id.startsWith(`${code}-`) || m.id.startsWith(`${code}_`)) {
      paths.add(m.filePath);
    }
  }

  const contents = new Map<string, string>();
  for (const p of paths) {
    try {
      const content = await readFile(p, 'utf-8');
      contents.set(p, content);
    } catch {
      // Skip unreadable files
    }
  }

  return contents;
}
