// @awa-component: TTST-Types

/** Raw fixture data parsed from TOML. */
export interface TestFixture {
  /** Fixture name (derived from filename without extension). */
  name: string;
  /** Feature flags to enable. */
  features: string[];
  /** Preset names to enable. */
  preset: string[];
  /** Feature flags to remove after preset expansion. */
  removeFeatures: string[];
  /** Files expected to exist in rendered output (relative paths). */
  expectedFiles: string[];
  /** Path to the fixture TOML file. */
  filePath: string;
}

/** Options for running tests. */
export interface TestRunOptions {
  /** Whether to update snapshots instead of comparing. */
  updateSnapshots: boolean;
}

/** Result of a single file assertion. */
export interface FileAssertionResult {
  /** Relative file path. */
  path: string;
  /** Whether the file was found. */
  found: boolean;
}

/** Result of a single snapshot file comparison. */
export interface SnapshotFileResult {
  /** Relative file path. */
  path: string;
  /** Status of the comparison. */
  status: 'match' | 'mismatch' | 'missing-snapshot' | 'extra-snapshot';
}

/** Result for a single fixture. */
export interface FixtureResult {
  /** Fixture name. */
  name: string;
  /** Whether the fixture passed all assertions. */
  passed: boolean;
  /** File existence assertion results. */
  fileResults: FileAssertionResult[];
  /** Snapshot comparison results (empty if no snapshots). */
  snapshotResults: SnapshotFileResult[];
  /** Error message if the fixture failed to run. */
  error?: string;
}

/** Aggregated result for all fixtures. */
export interface TestSuiteResult {
  /** Individual fixture results. */
  results: FixtureResult[];
  /** Total number of fixtures. */
  total: number;
  /** Number of passing fixtures. */
  passed: number;
  /** Number of failing fixtures. */
  failed: number;
}

/** CLI options for the test command. */
export interface RawTestOptions {
  template?: string;
  config?: string;
  updateSnapshots: boolean;
}
