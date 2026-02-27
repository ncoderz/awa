// @awa-component: CHK-CheckCommand

// @awa-impl: CHK-16_AC-1
export interface CheckConfig {
  readonly specGlobs: readonly string[];
  readonly codeGlobs: readonly string[];
  readonly ignore: readonly string[];
  readonly ignoreMarkers: readonly string[];
  readonly markers: readonly string[];
  readonly idPattern: string;
  readonly crossRefPatterns: readonly string[];
  readonly format: 'text' | 'json';
  readonly schemaDir: string;
  readonly schemaEnabled: boolean;
}

export const DEFAULT_CHECK_CONFIG: CheckConfig = {
  specGlobs: ['.awa/specs/**/*.md'],
  codeGlobs: ['src/**/*.{ts,js,tsx,jsx,py,go,rs,java,cs}'],
  ignore: ['node_modules/**', 'dist/**'],
  ignoreMarkers: [],
  markers: ['@awa-impl', '@awa-test', '@awa-component'],
  idPattern: '([A-Z][A-Z0-9]*-\\d+(?:\\.\\d+)?(?:_AC-\\d+)?|[A-Z][A-Z0-9]*_P-\\d+)',
  crossRefPatterns: ['IMPLEMENTS:', 'VALIDATES:'],
  format: 'text',
  schemaDir: '.awa/.agent/schemas',
  schemaEnabled: true,
};

export type FindingSeverity = 'error' | 'warning';

export type FindingCode =
  | 'orphaned-marker'
  | 'uncovered-ac'
  | 'broken-cross-ref'
  | 'invalid-id-format'
  | 'marker-trailing-text'
  | 'orphaned-spec'
  | 'schema-missing-section'
  | 'schema-wrong-level'
  | 'schema-missing-content'
  | 'schema-table-columns'
  | 'schema-prohibited'
  | 'schema-no-rule'
  | 'schema-line-limit';

export interface Finding {
  readonly severity: FindingSeverity;
  readonly code: FindingCode;
  readonly message: string;
  readonly filePath?: string;
  readonly line?: number;
  readonly id?: string;
  /** Path to the .rules.yaml file that defines the violated rule. */
  readonly ruleSource?: string;
  /** Concise representation of the violated rule. */
  readonly rule?: string;
}

export type MarkerType = 'impl' | 'test' | 'component';

export interface CodeMarker {
  readonly type: MarkerType;
  readonly id: string;
  readonly filePath: string;
  readonly line: number;
}

export interface MarkerScanResult {
  readonly markers: readonly CodeMarker[];
  readonly findings: readonly Finding[];
}

export interface CrossReference {
  readonly type: 'implements' | 'validates';
  readonly ids: readonly string[];
  readonly filePath: string;
  readonly line: number;
}

export interface SpecFile {
  readonly filePath: string;
  readonly code: string;
  readonly requirementIds: readonly string[];
  readonly acIds: readonly string[];
  readonly propertyIds: readonly string[];
  readonly componentNames: readonly string[];
  readonly crossRefs: readonly CrossReference[];
}

export interface SpecParseResult {
  readonly requirementIds: Set<string>;
  readonly acIds: Set<string>;
  readonly propertyIds: Set<string>;
  readonly componentNames: Set<string>;
  readonly allIds: Set<string>;
  readonly specFiles: readonly SpecFile[];
}

export interface CheckResult {
  readonly findings: readonly Finding[];
}

export interface RawCheckOptions {
  readonly ignore?: string[];
  readonly format?: string;
  readonly config?: string;
}
