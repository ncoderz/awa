// @awa-component: TRC-TraceCommand
// @awa-impl: TRC-8_AC-1, TRC-8_AC-2, TRC-2_AC-4

import { assembleContent } from '../core/trace/content-assembler.js';
import { formatContentJson, formatContentMarkdown } from '../core/trace/content-formatter.js';
import { formatJson, formatList, formatTree } from '../core/trace/formatter.js';
import { buildTraceIndex } from '../core/trace/index-builder.js';
import { resolveIds, resolveSourceFile, resolveTaskFile } from '../core/trace/input-resolver.js';
import { resolveTrace } from '../core/trace/resolver.js';
import { scan } from '../core/trace/scanner.js';
import { applyTokenBudget } from '../core/trace/token-estimator.js';
import type { TraceCommandOptions, TraceOptions } from '../core/trace/types.js';
import { logger } from '../utils/logger.js';

/**
 * Execute the `awa trace` command.
 * Returns exit code: 0 = chain found, 1 = ID not found / no context, 2 = internal error.
 */
export async function traceCommand(options: TraceCommandOptions): Promise<number> {
  try {
    // Scan markers and parse specs using shared scanner
    const { markers, specs } = await scan(options.config);

    // Build the traceability index
    const index = buildTraceIndex(specs, markers);

    // Resolve input to IDs
    let ids: readonly string[];
    let warnings: readonly string[] = [];
    if (options.all) {
      ids = [...index.allIds];
    } else if (options.task) {
      const resolved = await resolveTaskFile(options.task, index);
      ids = resolved.ids;
      warnings = resolved.warnings;
    } else if (options.file) {
      const resolved = await resolveSourceFile(options.file, index);
      ids = resolved.ids;
      warnings = resolved.warnings;
    } else if (options.ids.length > 0) {
      const resolved = resolveIds([...options.ids], index);
      ids = resolved.ids;
      warnings = resolved.warnings;
    } else {
      logger.error('No IDs, --all, --task, or --file specified');
      return 1;
    }

    // Log warnings for unresolved IDs
    for (const w of warnings) {
      logger.warn(w);
    }

    if (ids.length === 0) {
      if (options.file) {
        logger.error('No traceability markers found in file');
      } else if (options.task) {
        logger.error('No traceability IDs found in task file');
      } else {
        logger.error('No valid IDs found');
      }
      return 1;
    }

    // Resolve trace chains
    const traceOptions: TraceOptions = {
      direction: options.direction,
      depth: options.depth,
      scope: options.scope,
      noCode: options.noCode,
      noTests: options.noTests,
    };
    const result = resolveTrace(index, ids, traceOptions);

    if (result.chains.length === 0 && result.notFound.length > 0) {
      for (const id of result.notFound) {
        logger.error(`ID not found: ${id}`);
      }
      return 1;
    }

    // Format output
    let output: string;
    const isContentMode = options.content || options.maxTokens !== undefined;
    const queryLabel = ids.join(', ');

    if (isContentMode) {
      // Content mode: assemble actual file sections
      const sections = await assembleContent(result, options.task, {
        beforeContext: options.beforeContext,
        afterContext: options.afterContext,
      });
      let finalSections = sections;
      let footer: string | null = null;

      if (options.maxTokens !== undefined) {
        const budgeted = applyTokenBudget(sections, options.maxTokens);
        finalSections = budgeted.sections;
        footer = budgeted.footer;
      }

      if (options.json) {
        output = formatContentJson(finalSections, queryLabel, footer);
      } else {
        output = formatContentMarkdown(finalSections, queryLabel, footer);
      }
    } else if (options.list) {
      output = formatList(result);
    } else if (options.json) {
      output = formatJson(result);
    } else {
      output = formatTree(result);
    }

    // Output
    process.stdout.write(output);

    // Warn about not-found IDs if some chains were found
    if (result.notFound.length > 0) {
      for (const id of result.notFound) {
        logger.warn(`ID not found: ${id}`);
      }
    }

    return 0;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    return 2;
  }
}
