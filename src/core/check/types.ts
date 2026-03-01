// @awa-component: CHK-CheckCommand

// @awa-impl: CHK-16_AC-1
export interface CheckConfig {
  readonly specGlobs: readonly string[];
  readonly codeGlobs: readonly string[];
  readonly specIgnore: readonly string[];
  readonly codeIgnore: readonly string[];
  readonly ignoreMarkers: readonly string[];
  readonly markers: readonly string[];
  readonly idPattern: string;
  readonly crossRefPatterns: readonly string[];
  readonly format: 'text' | 'json';
  readonly schemaDir: string;
  readonly schemaEnabled: boolean;
  readonly allowWarnings: boolean;
  readonly specOnly: boolean;
}

export const DEFAULT_CHECK_CONFIG: CheckConfig = {
  specGlobs: [
    '.awa/specs/ARCHITECTURE.md',
    '.awa/specs/FEAT-*.md',
    '.awa/specs/REQ-*.md',
    '.awa/specs/DESIGN-*.md',
    '.awa/specs/EXAMPLES-*.md',
    '.awa/specs/API-*.tsp',
    '.awa/tasks/TASK-*.md',
    '.awa/plans/PLAN-*.md',
    '.awa/align/ALIGN-*.md',
  ],
  codeGlobs: [
    '**/*.{ts,js,tsx,jsx,mts,mjs,cjs,py,go,rs,java,kt,kts,cs,c,h,cpp,cc,cxx,hpp,hxx,swift,rb,php,scala,ex,exs,dart,lua,zig}',
  ],
  specIgnore: [],
  codeIgnore: [
    'node_modules/**',
    'dist/**',
    'vendor/**',
    'target/**',
    'build/**',
    'out/**',
    '.awa/**',
  ],
  ignoreMarkers: [],
  markers: ['@awa-impl', '@awa-test', '@awa-component'],
  idPattern: '([A-Z][A-Z0-9]*-\\d+(?:\\.\\d+)?(?:_AC-\\d+)?|[A-Z][A-Z0-9]*_P-\\d+)',
  crossRefPatterns: ['IMPLEMENTS:', 'VALIDATES:'],
  format: 'text',
  schemaDir: '.awa/.agent/schemas',
  schemaEnabled: true,
  allowWarnings: false,
  specOnly: false,
};

export type FindingSeverity = 'error' | 'warning';

export type FindingCode =
  | 'orphaned-marker'
  | 'uncovered-ac'
  | 'uncovered-component'
  | 'unimplemented-ac'
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
  /** Path to the .schema.yaml file that defines the violated rule. */
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
  /** Maps IDs parsed from this file to their line number. Populated by spec-parser. */
  readonly idLocations?: ReadonlyMap<string, { filePath: string; line: number }>;
}

export interface SpecParseResult {
  readonly requirementIds: Set<string>;
  readonly acIds: Set<string>;
  readonly propertyIds: Set<string>;
  readonly componentNames: Set<string>;
  readonly allIds: Set<string>;
  readonly specFiles: readonly SpecFile[];
  /** Maps spec IDs (requirements, ACs, properties, components) to their source location. */
  readonly idLocations: ReadonlyMap<string, { filePath: string; line: number }>;
}

export interface CheckResult {
  readonly findings: readonly Finding[];
}

export interface RawCheckOptions {
  readonly specIgnore?: string[];
  readonly codeIgnore?: string[];
  readonly format?: string;
  readonly config?: string;
  readonly allowWarnings?: boolean;
  readonly specOnly?: boolean;
}
