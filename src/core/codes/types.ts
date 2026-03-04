/** Which spec document types exist for a feature code. */
export interface DocTypes {
  /** FEAT file exists. */
  readonly feat: boolean;
  /** At least one REQ file exists. */
  readonly req: boolean;
  /** At least one DESIGN file exists. */
  readonly design: boolean;
  /** At least one API file exists. */
  readonly api: boolean;
  /** At least one EXAMPLE file exists. */
  readonly example: boolean;
}

/** A single feature code discovered from spec files. */
export interface FeatureCode {
  /** The feature code (e.g. "CHK", "TRC"). */
  readonly code: string;
  /** The feature name derived from the filename (e.g. "check", "trace"). */
  readonly feature: string;
  /** Number of requirements (top-level IDs like CHK-1, CHK-2). */
  readonly reqCount: number;
  /** Scope summary extracted from the first paragraph of the FEAT file. */
  readonly scope: string;
  /** Which spec document types exist for this code. */
  readonly docs: DocTypes;
}

/** Result of scanning for feature codes. */
export interface CodesResult {
  /** All discovered feature codes, sorted alphabetically by code. */
  readonly codes: readonly FeatureCode[];
}

/** Options for the codes command. */
export interface CodesCommandOptions {
  /** Output results as JSON. */
  readonly json?: boolean;
  /** Output compact one-line summary. */
  readonly summary?: boolean;
  /** Path to configuration file. */
  readonly config?: string;
}
