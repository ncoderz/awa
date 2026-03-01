// @awa-component: TRC-TraceTypes

/** Location of a code marker or spec ID in a file. */
export interface CodeLocation {
  readonly filePath: string;
  readonly line: number;
}

/** The core traceability index — maps between spec IDs, markers, and code locations. */
export interface TraceIndex {
  // Forward maps (spec → downstream)
  /** Requirement ID → its AC IDs. e.g. DIFF-1 → [DIFF-1_AC-1, DIFF-1_AC-2] */
  readonly reqToACs: ReadonlyMap<string, readonly string[]>;
  /** AC ID → design component names that IMPLEMENT it. */
  readonly acToDesignComponents: ReadonlyMap<string, readonly string[]>;
  /** AC ID → code locations with @awa-impl markers. */
  readonly acToCodeLocations: ReadonlyMap<string, readonly CodeLocation[]>;
  /** AC ID → test locations with @awa-test markers. */
  readonly acToTestLocations: ReadonlyMap<string, readonly CodeLocation[]>;
  /** Property ID → test locations with @awa-test markers. */
  readonly propertyToTestLocations: ReadonlyMap<string, readonly CodeLocation[]>;
  /** Component name → code locations with @awa-component markers. */
  readonly componentToCodeLocations: ReadonlyMap<string, readonly CodeLocation[]>;

  // Reverse maps (downstream → spec)
  /** AC ID → parent requirement ID. e.g. DIFF-1_AC-1 → DIFF-1 */
  readonly acToReq: ReadonlyMap<string, string>;
  /** Component name → AC IDs it implements. */
  readonly componentToACs: ReadonlyMap<string, readonly string[]>;
  /** Property ID → AC IDs it validates. */
  readonly propertyToACs: ReadonlyMap<string, readonly string[]>;

  // Metadata
  /** All known IDs → their definition location in spec files. */
  readonly idLocations: ReadonlyMap<string, CodeLocation>;
  /** All known IDs in the index. */
  readonly allIds: ReadonlySet<string>;
}

/** A single node in a trace chain result. */
export interface TraceNode {
  readonly id: string;
  readonly type: 'requirement' | 'ac' | 'property' | 'component' | 'implementation' | 'test';
  readonly location: CodeLocation;
  /** Additional context — e.g. IMPLEMENTS references for design components. */
  readonly meta?: Record<string, string>;
}

/** Result of resolving a trace chain for one ID. */
export interface TraceChain {
  readonly queryId: string;
  readonly requirement?: TraceNode;
  readonly acs: readonly TraceNode[];
  readonly designComponents: readonly TraceNode[];
  readonly implementations: readonly TraceNode[];
  readonly tests: readonly TraceNode[];
  readonly properties: readonly TraceNode[];
}

/** Complete result from a trace query (may cover multiple IDs). */
export interface TraceResult {
  readonly chains: readonly TraceChain[];
  /** IDs that were queried but not found. */
  readonly notFound: readonly string[];
}

/** Options controlling trace resolution. */
export interface TraceOptions {
  readonly direction: 'both' | 'forward' | 'reverse';
  readonly depth?: number;
  readonly scope?: string;
  readonly noCode?: boolean;
  readonly noTests?: boolean;
}

/** Options controlling content output. */
export interface ContentOptions {
  readonly content: boolean;
  readonly beforeContext?: number;
  readonly afterContext?: number;
  readonly maxTokens?: number;
}

/** A content section ready for output. */
export interface ContentSection {
  readonly type: 'task' | 'requirement' | 'design' | 'feature' | 'implementation' | 'test' | 'architecture' | 'examples';
  readonly filePath: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly content: string;
  /** Priority for token budget truncation (1 = highest). */
  readonly priority: number;
}

/** Output format options. */
export type OutputFormat = 'tree' | 'content' | 'list' | 'json';

/** CLI options for the trace command. */
export interface TraceCommandOptions {
  readonly ids: readonly string[];
  readonly task?: string;
  readonly file?: string;
  readonly content: boolean;
  readonly list: boolean;
  readonly json: boolean;
  readonly maxTokens?: number;
  readonly depth?: number;
  readonly scope?: string;
  readonly direction: 'both' | 'forward' | 'reverse';
  readonly beforeContext?: number;
  readonly afterContext?: number;
  readonly noCode?: boolean;
  readonly noTests?: boolean;
  readonly config?: string;
}
