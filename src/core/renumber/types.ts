// Types shared across the renumber module.
// Components are declared in their respective implementation files.

/**
 * Mapping from old ID strings to new ID strings for one feature code.
 */
export interface RenumberMap {
  readonly code: string;
  readonly entries: ReadonlyMap<string, string>;
}

/**
 * A file touched by propagation with per-line replacement details.
 */
export interface AffectedFile {
  readonly filePath: string;
  readonly replacements: readonly Replacement[];
}

/**
 * A single ID replacement within a file.
 */
export interface Replacement {
  readonly line: number;
  readonly oldId: string;
  readonly newId: string;
}

/**
 * Aggregated output of the renumber pipeline for one feature code.
 */
export interface RenumberResult {
  readonly code: string;
  readonly map: RenumberMap;
  readonly affectedFiles: readonly AffectedFile[];
  readonly totalReplacements: number;
  readonly malformedWarnings: readonly MalformedWarning[];
  readonly malformedCorrections: readonly MalformedCorrection[];
  readonly noChange: boolean;
}

/**
 * CLI options passed to the renumber command.
 */
export interface RenumberCommandOptions {
  readonly code?: string;
  readonly all?: boolean;
  readonly dryRun?: boolean;
  readonly json?: boolean;
  readonly config?: string;
  readonly expandUnambiguousIds?: boolean;
}

/**
 * Warning about a malformed ID token.
 */
export interface MalformedWarning {
  readonly filePath: string;
  readonly line: number;
  readonly token: string;
}

/**
 * A correction applied to a malformed ID token.
 */
export interface MalformedCorrection {
  readonly filePath: string;
  readonly line: number;
  readonly token: string;
  readonly replacement: string;
}

/**
 * Result of map building.
 */
export interface MapBuildResult {
  readonly map: RenumberMap;
  readonly noChange: boolean;
}

/**
 * Result of propagation.
 */
export interface PropagationResult {
  readonly affectedFiles: readonly AffectedFile[];
  readonly totalReplacements: number;
}

// --- Error types ---

export type RenumberErrorCode = 'CODE_NOT_FOUND' | 'NO_ARGS' | 'WRITE_FAILED';

export class RenumberError extends Error {
  readonly errorCode: RenumberErrorCode;

  constructor(errorCode: RenumberErrorCode, message: string) {
    super(message);
    this.name = 'RenumberError';
    this.errorCode = errorCode;
  }
}
