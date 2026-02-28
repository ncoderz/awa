// @awa-component: GEN-CoreTypes

// Custom error classes for diff operations
export class DiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiffError';
  }
}

// RawCliOptions - CLI argument parser output
export interface RawCliOptions {
  output?: string; // Optional positional argument (required if not in config)
  template?: string;
  features?: string[];
  preset?: string[];
  removeFeatures?: string[];
  force?: boolean;
  dryRun?: boolean;
  delete?: boolean;
  config?: string;
  refresh?: boolean;
  listUnknown?: boolean;
  watch?: boolean;
  overlay?: string[];
  json?: boolean;
  summary?: boolean;
}

// PresetDefinitions - Named feature bundles
export interface PresetDefinitions {
  [presetName: string]: string[];
}

// FileConfig - TOML configuration file structure
export interface FileConfig {
  output?: string;
  template?: string;
  features?: string[];
  preset?: string[];
  'remove-features'?: string[];
  force?: boolean;
  'dry-run'?: boolean;
  delete?: boolean;
  refresh?: boolean;
  presets?: PresetDefinitions;
  'list-unknown'?: boolean;
  check?: Record<string, unknown>;
  overlay?: string[];
}

// ResolvedOptions - Fully resolved configuration with defaults applied
export interface ResolvedOptions {
  readonly output: string;
  readonly template: string | null;
  readonly features: readonly string[];
  readonly preset: readonly string[];
  readonly removeFeatures: readonly string[];
  readonly force: boolean;
  readonly dryRun: boolean;
  readonly delete: boolean;
  readonly refresh: boolean;
  readonly presets: PresetDefinitions;
  readonly listUnknown: boolean;
  readonly overlay: readonly string[];
  readonly json: boolean;
  readonly summary: boolean;
}

// TemplateSourceType - Template source type detection
export type TemplateSourceType = 'local' | 'git' | 'bundled';

// ResolvedTemplate - Template source resolution result
export interface ResolvedTemplate {
  type: TemplateSourceType;
  localPath: string;
  source: string;
}

// TemplateContext - Context passed to template engine
export interface TemplateContext {
  features: string[];
  version?: string;
}

// RenderResult - Template rendering output
export interface RenderResult {
  content: string;
  isEmpty: boolean;
  isEmptyFileMarker: boolean;
}

// FileAction - Tagged union for file operations
export type FileAction =
  | { type: 'create'; sourcePath: string; outputPath: string }
  | { type: 'overwrite'; sourcePath: string; outputPath: string }
  | { type: 'skip-user'; sourcePath: string; outputPath: string }
  | { type: 'skip-empty'; sourcePath: string; outputPath: string }
  | { type: 'skip-equal'; sourcePath: string; outputPath: string }
  | { type: 'delete'; outputPath: string };

// GenerationResult - Aggregated generation outcome
export interface GenerationResult {
  readonly actions: readonly FileAction[];
  readonly created: number;
  readonly overwritten: number;
  readonly deleted: number;
  readonly skipped: number;
  readonly skippedEmpty: number;
  readonly skippedUser: number;
  readonly skippedEqual: number;
}

// GenerateOptions - File generation parameters
export interface GenerateOptions {
  templatePath: string;
  outputPath: string;
  features: string[];
  force: boolean;
  dryRun: boolean;
  delete: boolean;
}

// ConflictChoice - User choice for conflict resolution
export type ConflictChoice = 'overwrite' | 'skip';

// ConflictItem - Individual file conflict for batch resolution
export interface ConflictItem {
  outputPath: string;
  sourcePath: string;
  newContent: string;
  existingContent: string;
}

// BatchConflictResolution - Result of batch conflict resolution
export interface BatchConflictResolution {
  overwrite: string[]; // List of output paths to overwrite
  skip: string[]; // List of output paths to skip
  equal: string[]; // List of output paths skipped because content is identical
}

// TemplateFile - Template file metadata
export interface TemplateFile {
  path: string;
  absolutePath: string;
  isPartial: boolean;
}

// DiffOptions - Diff operation parameters
export interface DiffOptions {
  templatePath: string;
  targetPath: string;
  features: string[];
  listUnknown: boolean;
}

// FileDiffStatus - File comparison status
export type FileDiffStatus =
  | 'identical'
  | 'modified'
  | 'new'
  | 'extra'
  | 'binary-differs'
  | 'delete-listed';

// FileDiff - Comparison result for a single file
export interface FileDiff {
  relativePath: string;
  status: FileDiffStatus;
  unifiedDiff?: string; // Present only for 'modified' text files
}

// DiffResult - Aggregated diff outcome
export interface DiffResult {
  files: FileDiff[];
  identical: number;
  modified: number;
  newFiles: number;
  extraFiles: number;
  binaryDiffers: number;
  deleteListed: number;
  hasDifferences: boolean;
}

// CachedTemplate - Cached Git template metadata
export interface CachedTemplate {
  source: string;
  localPath: string;
  fetchedAt: Date;
  ref?: string;
}

// JSON output types for --json flag
// @awa-impl: JSON-3_AC-1
export interface GenerationActionJSON {
  type: string;
  path: string;
}

export interface GenerationJSON {
  actions: GenerationActionJSON[];
  counts: {
    created: number;
    overwritten: number;
    skipped: number;
    deleted: number;
  };
}

// @awa-impl: JSON-4_AC-1
export interface DiffFileJSON {
  path: string;
  status: string;
  diff?: string;
}

export interface DiffJSON {
  diffs: DiffFileJSON[];
  counts: {
    changed: number;
    new: number;
    matching: number;
    deleted: number;
  };
}

// Custom error types
export class ConfigError extends Error {
  constructor(
    message: string,
    public code:
      | 'FILE_NOT_FOUND'
      | 'PARSE_ERROR'
      | 'INVALID_TYPE'
      | 'MISSING_OUTPUT'
      | 'INVALID_PRESET'
      | 'UNKNOWN_PRESET',
    public filePath?: string | null
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class TemplateError extends Error {
  constructor(
    message: string,
    public code: 'SOURCE_NOT_FOUND' | 'FETCH_FAILED' | 'RENDER_ERROR',
    public source?: string
  ) {
    super(message);
    this.name = 'TemplateError';
  }
}

export class GenerationError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'DISK_FULL'
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}
