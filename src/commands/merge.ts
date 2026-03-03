import { fixCodesTable } from '../core/check/codes-fixer.js';
import { executeMoves } from '../core/merge/content-merger.js';
import { formatJson, formatText } from '../core/merge/reporter.js';
import { findStaleRefs, validateMerge } from '../core/merge/spec-mover.js';
import type { MergeCommandOptions, MergeResult } from '../core/merge/types.js';
import { MergeError } from '../core/merge/types.js';
import { buildRecodeMap } from '../core/recode/map-builder.js';
import { RecodeError } from '../core/recode/types.js';
import { propagate } from '../core/renumber/propagator.js';
import { scan } from '../core/trace/scanner.js';
import { logger } from '../utils/logger.js';

/**
 * Execute the `awa spec merge` command.
 *
 * Pipeline:
 *   1. Recode: build offset map (renumber source past target's highest IDs) + propagate.
 *   2. Move: for each source spec file, rename it by changing only the code prefix.
 *      When a filename clash occurs, an incrementing index suffix is appended.
 *   3. Stale-ref check: warn about leftover source-code references.
 *   4. Post-processing: optional renumber + ARCHITECTURE.md codes table fix.
 *
 * Returns exit code: 0 = no changes needed, 1 = changes applied/previewed, 2 = error.
 */
export async function mergeCommand(options: MergeCommandOptions): Promise<number> {
  try {
    // Validate preconditions
    validateMerge(options.sourceCode, options.targetCode);

    const { markers, specs } = await scan(options.config);
    const dryRun = options.dryRun === true;

    // Phase 1: Recode — build offset map and propagate ID changes across all files.
    // buildRecodeMap finds the highest target IDs and offsets source IDs past them,
    // then recodes source code → target code in one pass.
    const { map, noChange: recodeNoChange } = buildRecodeMap(
      options.sourceCode,
      options.targetCode,
      specs
    );

    let affectedFiles: readonly import('../core/renumber/types.js').AffectedFile[] = [];
    let totalReplacements = 0;

    if (!recodeNoChange) {
      const result = await propagate(map, specs, markers, dryRun);
      affectedFiles = result.affectedFiles;
      totalReplacements = result.totalReplacements;
    }

    // Phase 2: Move source files to target code namespace (rename only).
    // Source files already contain recoded IDs after Phase 1.
    const moves = await executeMoves(
      options.sourceCode,
      options.targetCode,
      specs.specFiles,
      dryRun
    );

    // Phase 3: Find stale references (re-scan non-source files)
    const movedSourcePaths = new Set(moves.map((m) => m.sourceFile));
    const nonSourceFiles = specs.specFiles.filter((sf) => !movedSourcePaths.has(sf.filePath));
    const staleRefs = await findStaleRefs(options.sourceCode, nonSourceFiles);

    const noChange = recodeNoChange && moves.length === 0;

    const result: MergeResult = {
      sourceCode: options.sourceCode,
      targetCode: options.targetCode,
      map,
      affectedFiles,
      totalReplacements,
      moves,
      staleRefs,
      noChange,
    };

    outputResult(result, dryRun, options.json === true);

    // Stale references are errors — abort with exit code 2
    if (staleRefs.length > 0) {
      return 2;
    }

    // Phase 4: Optional renumber
    if (options.renumber && !dryRun && !noChange) {
      const { renumberCommand } = await import('./renumber.js');
      await renumberCommand({
        code: options.targetCode,
        dryRun: false,
        json: options.json,
        config: options.config,
      });
    }

    // Update Feature Codes table in ARCHITECTURE.md
    if (!dryRun && !noChange) {
      const { specs: freshSpecs, config: scanConfig } = await scan(options.config);
      await fixCodesTable(freshSpecs, scanConfig);
    }

    return noChange ? 0 : 1;
  } catch (err) {
    if (err instanceof MergeError) {
      logger.error(err.message);
      return 2;
    }
    if (err instanceof RecodeError) {
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
 * Output the merge result in the requested format.
 */
function outputResult(result: MergeResult, dryRun: boolean, json: boolean): void {
  if (json) {
    process.stdout.write(`${formatJson(result)}\n`);
  } else {
    const text = formatText(result, dryRun);
    logger.info(text);
  }
}
