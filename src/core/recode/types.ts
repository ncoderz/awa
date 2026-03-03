// Types shared across the recode module.
// Components are declared in their respective implementation files.

import type { AffectedFile, RenumberMap } from '../renumber/types.js';

/**
 * A file rename operation: old path → new path.
 */
export interface FileRename {
  readonly oldPath: string;
  readonly newPath: string;
}

/**
 * Aggregated output of the recode pipeline.
 */
export interface RecodeResult {
  readonly sourceCode: string;
  readonly targetCode: string;
  readonly map: RenumberMap;
  readonly affectedFiles: readonly AffectedFile[];
  readonly totalReplacements: number;
  readonly renames: readonly FileRename[];
  readonly staleRefs: readonly string[];
  readonly noChange: boolean;
}

/**
 * CLI options passed to the recode command.
 */
export interface RecodeCommandOptions {
  readonly sourceCode: string;
  readonly targetCode: string;
  readonly dryRun?: boolean;
  readonly json?: boolean;
  readonly renumber?: boolean;
  readonly config?: string;
}

// --- Error types ---

export type RecodeErrorCode = 'SOURCE_NOT_FOUND' | 'TARGET_NOT_FOUND' | 'RENAME_CONFLICT';

export class RecodeError extends Error {
  readonly errorCode: RecodeErrorCode;

  constructor(errorCode: RecodeErrorCode, message: string) {
    super(message);
    this.name = 'RecodeError';
    this.errorCode = errorCode;
  }
}
