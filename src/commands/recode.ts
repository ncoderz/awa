// @awa-component: RCOD-RecodeCommand
// @awa-impl: RCOD-2_AC-1, RCOD-2_AC-2
// @awa-impl: RCOD-3_AC-1, RCOD-3_AC-2
// @awa-impl: RCOD-4_AC-1, RCOD-4_AC-4

import { fixCodesTable } from '../core/check/codes-fixer.js';
import { collectFiles } from '../core/check/glob.js';
import {
  detectConflicts,
  executeRenames,
  findStaleRefs,
  planRenames,
} from '../core/merge/spec-mover.js';
import { buildRecodeMap } from '../core/recode/map-builder.js';
import { formatJson, formatText } from '../core/recode/reporter.js';
import type { RecodeCommandOptions, RecodeResult } from '../core/recode/types.js';
import { RecodeError } from '../core/recode/types.js';
import { propagate } from '../core/renumber/propagator.js';
import { scan } from '../core/trace/scanner.js';
import { logger } from '../utils/logger.js';

/**
 * Execute the `awa spec recode` command.
 * Returns exit code: 0 = no changes needed, 1 = changes applied/previewed, 2 = error.
 */
// @awa-impl: RCOD-4_AC-1, RCOD-4_AC-4
export async function recodeCommand(options: RecodeCommandOptions): Promise<number> {
  try {
    const { markers, specs, config } = await scan(options.config);
    const dryRun = options.dryRun === true;

    // Phase 1: Build recode map (validates both codes exist)
    // @awa-impl: RCOD-3_AC-1, RCOD-3_AC-2
    const { map, noChange: recodeNoChange } = buildRecodeMap(
      options.sourceCode,
      options.targetCode,
      specs,
    );

    // Phase 2: Propagate changes using RENUM propagator
    let affectedFiles: readonly import('../core/renumber/types.js').AffectedFile[] = [];
    let totalReplacements = 0;

    if (!recodeNoChange) {
      // @awa-impl: RCOD-2_AC-1, RCOD-2_AC-2
      const result = await propagate(map, specs, markers, config, dryRun);
      affectedFiles = result.affectedFiles;
      totalReplacements = result.totalReplacements;
    }

    // Phase 3: Spec file restructuring — rename source files to target code
    const renames = planRenames(options.sourceCode, options.targetCode, specs.specFiles);

    // Check for conflicts (target filenames already exist → use merge instead)
    const conflicts = detectConflicts(renames, specs.specFiles);
    if (conflicts.length > 0) {
      throw new RecodeError(
        'RENAME_CONFLICT',
        `File rename conflict(s): ${conflicts.join(', ')}. Use \`awa spec merge\` to combine codes with overlapping files.`,
      );
    }

    // Execute renames (move files + update headings)
    await executeRenames(renames, options.sourceCode, options.targetCode, dryRun);

    // Phase 4: Find stale references — exclude renamed source files
    // and files the propagator already handled (or would handle in dry-run)
    const renamedPaths = new Set(renames.map((r) => r.oldPath));
    const propagatedPaths = new Set(affectedFiles.map((af) => af.filePath));
    const specFilePaths = specs.specFiles.map((sf) => sf.filePath);
    const combinedIgnore = [...config.specIgnore, ...config.extraSpecIgnore];
    const extraFiles = await collectFiles(config.extraSpecGlobs, combinedIgnore);
    const allFiles = [...new Set([...specFilePaths, ...extraFiles])].filter(
      (p) => !renamedPaths.has(p) && !propagatedPaths.has(p),
    );
    const staleRefs = await findStaleRefs(options.sourceCode, allFiles);

    const noChange = recodeNoChange && renames.length === 0;

    const result: RecodeResult = {
      sourceCode: options.sourceCode,
      targetCode: options.targetCode,
      map,
      affectedFiles,
      totalReplacements,
      renames,
      staleRefs,
      noChange,
    };

    outputResult(result, dryRun, options.json === true);

    // Stale references are errors — exit code 2
    if (staleRefs.length > 0) {
      return 2;
    }

    // Phase 5: Update ARCHITECTURE.md Feature Codes table
    if (!dryRun && !noChange) {
      const { specs: freshSpecs, config: scanConfig } = await scan(options.config);
      await fixCodesTable(freshSpecs, scanConfig);
    }

    return noChange ? 0 : 1;
  } catch (err) {
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
 * Output the recode result in the requested format.
 */
function outputResult(result: RecodeResult, dryRun: boolean, json: boolean): void {
  if (json) {
    process.stdout.write(`${formatJson(result)}\n`);
  } else {
    const text = formatText(result, dryRun);
    logger.info(text);
  }
}
