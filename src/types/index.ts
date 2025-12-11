// @zen-component: TypeDefinitions

// RawCliOptions - CLI argument parser output
export interface RawCliOptions {
  output?: string;
  template?: string;
  features?: string[];
  force?: boolean;
  dryRun?: boolean;
  config?: string;
  refresh?: boolean;
}

// FileConfig - TOML configuration file structure
export interface FileConfig {
  output?: string;
  template?: string;
  features?: string[];
  force?: boolean;
  'dry-run'?: boolean;
  refresh?: boolean;
}

// ResolvedOptions - Fully resolved configuration with defaults applied
export interface ResolvedOptions {
  readonly output: string;
  readonly template: string | null;
  readonly features: readonly string[];
  readonly force: boolean;
  readonly dryRun: boolean;
  readonly refresh: boolean;
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
  | { type: 'skip-empty'; sourcePath: string; outputPath: string };

// GenerationResult - Aggregated generation outcome
export interface GenerationResult {
  readonly actions: readonly FileAction[];
  readonly created: number;
  readonly overwritten: number;
  readonly skipped: number;
  readonly skippedEmpty: number;
  readonly skippedUser: number;
}

// GenerateOptions - File generation parameters
export interface GenerateOptions {
  templatePath: string;
  outputPath: string;
  features: string[];
  force: boolean;
  dryRun: boolean;
}

// ConflictChoice - User choice for conflict resolution
export type ConflictChoice = 'overwrite' | 'skip';

// TemplateFile - Template file metadata
export interface TemplateFile {
  path: string;
  absolutePath: string;
  isPartial: boolean;
}

// CachedTemplate - Cached Git template metadata
export interface CachedTemplate {
  source: string;
  localPath: string;
  fetchedAt: Date;
  ref?: string;
}

// Custom error types
export class ConfigError extends Error {
  constructor(
    message: string,
    public code: 'FILE_NOT_FOUND' | 'PARSE_ERROR' | 'INVALID_TYPE',
    public filePath?: string
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
    public code: 'PERMISSION_DENIED' | 'DISK_FULL',
    public filePath?: string
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}
