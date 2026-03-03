import { formatJson, formatSummary, formatTable } from '../core/codes/reporter.js';
import { scanCodes } from '../core/codes/scanner.js';
import type { CodesCommandOptions } from '../core/codes/types.js';
import { scan } from '../core/trace/scanner.js';
import { logger } from '../utils/logger.js';

/**
 * Execute the `awa spec codes` command.
 * Returns exit code: 0 = success, 2 = internal error.
 */
export async function codesCommand(options: CodesCommandOptions): Promise<number> {
  try {
    const { specs, config } = await scan(options.config);

    const result = await scanCodes(specs.specFiles, config.specGlobs, config.specIgnore);

    if (options.summary) {
      process.stdout.write(`${formatSummary(result)}\n`);
    } else if (options.json) {
      process.stdout.write(`${formatJson(result)}\n`);
    } else {
      process.stdout.write(`${formatTable(result)}\n`);
    }

    return 0;
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err.message);
    } else {
      logger.error(String(err));
    }
    return 2;
  }
}
