// Types shared across the merge module.

import type { AffectedFile, RenumberMap } from '../renumber/types.js';

/**
 * A file append operation: source content appended to target (or target created).
 */
export interface FileAppend {
  readonly sourceFile: string;
  readonly targetFile: string;
  readonly created: boolean;
  readonly docType: string;
}

/**
 * Aggregated output of the merge pipeline.
 */
export interface MergeResult {
  readonly sourceCode: string;
  readonly targetCode: string;
  readonly map: RenumberMap;
  readonly affectedFiles: readonly AffectedFile[];
  readonly totalReplacements: number;
  readonly appends: readonly FileAppend[];
  readonly staleRefs: readonly string[];
  readonly noChange: boolean;
}

/**
 * CLI options passed to the merge command.
 */
export interface MergeCommandOptions {
  readonly sourceCode: string;
  readonly targetCode: string;
  readonly dryRun?: boolean;
  readonly json?: boolean;
  readonly renumber?: boolean;
  readonly config?: string;
}

// --- Error types ---

export type MergeErrorCode =
  | 'SOURCE_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'SELF_MERGE';

export class MergeError extends Error {
  readonly errorCode: MergeErrorCode;

  constructor(errorCode: MergeErrorCode, message: string) {
    super(message);
    this.name = 'MergeError';
    this.errorCode = errorCode;
  }
}
