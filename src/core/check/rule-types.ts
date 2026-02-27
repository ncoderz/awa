// @awa-component: CHK-RuleLoader

/**
 * Types for declarative YAML rule files that define structural
 * expectations for Markdown spec documents.
 */

/** Condition that gates a contains rule based on the matched section heading. */
export interface WhenCondition {
  /** Apply rule only when heading matches this regex. */
  readonly 'heading-matches'?: string;
  /** Apply rule only when heading does NOT match this regex. */
  readonly 'heading-not-matches'?: string;
}

/** A contains rule that checks for a regex pattern in section body. */
export interface PatternContainsRule {
  readonly pattern: string;
  readonly label?: string;
  /** Human/LLM-readable description of what this rule checks. */
  readonly description?: string;
  readonly required?: boolean;
  /** If true, the pattern must NOT appear (inverts the check). */
  readonly prohibited?: boolean;
  /** Conditional gate — rule only applies when heading matches/not-matches. */
  readonly when?: WhenCondition;
}

/** A contains rule that checks for list items matching a pattern. */
export interface ListContainsRule {
  readonly list: {
    readonly pattern: string;
    readonly min?: number;
    readonly label?: string;
  };
  /** Human/LLM-readable description of what this rule checks. */
  readonly description?: string;
  /** Conditional gate — rule only applies when heading matches/not-matches. */
  readonly when?: WhenCondition;
}

/** A contains rule that checks table structure. */
export interface TableContainsRule {
  readonly table: {
    readonly heading?: string;
    readonly columns: readonly string[];
    readonly 'min-rows'?: number;
  };
  /** Human/LLM-readable description of what this rule checks. */
  readonly description?: string;
  /** Conditional gate — rule only applies when heading matches/not-matches. */
  readonly when?: WhenCondition;
}

/** A contains rule that checks for at least one fenced code block. */
export interface CodeBlockContainsRule {
  readonly 'code-block': true;
  readonly label?: string;
  /** Human/LLM-readable description of what this rule checks. */
  readonly description?: string;
  /** Conditional gate — rule only applies when heading matches/not-matches. */
  readonly when?: WhenCondition;
}

/** A contains rule that checks for a heading or text label. */
export interface HeadingOrTextContainsRule {
  readonly 'heading-or-text': string;
  readonly required?: boolean;
  /** Human/LLM-readable description of what this rule checks. */
  readonly description?: string;
  /** Conditional gate — rule only applies when heading matches/not-matches. */
  readonly when?: WhenCondition;
}

/** Union of all contains rule types. */
export type ContainsRule =
  | PatternContainsRule
  | ListContainsRule
  | TableContainsRule
  | CodeBlockContainsRule
  | HeadingOrTextContainsRule;

/** A section rule defining expected heading structure and content. */
export interface SectionRule {
  readonly heading: string;
  readonly level: number;
  readonly required?: boolean;
  readonly repeatable?: boolean;
  /** Human/LLM-readable description of this section's purpose. */
  readonly description?: string;
  readonly children?: readonly SectionRule[];
  readonly contains?: readonly ContainsRule[];
}

/** A complete rule file parsed from YAML. */
export interface RuleFile {
  readonly 'target-files': string;
  /** Human/LLM-readable description of this document type's purpose. */
  readonly description?: string;
  readonly sections: readonly SectionRule[];
  readonly 'sections-prohibited'?: readonly string[];
  /** Complete conforming example document (used by LLMs as a reference). */
  readonly example?: string;
}

/** A loaded and validated rule set with resolved file matching. */
export interface LoadedRuleSet {
  readonly ruleFile: RuleFile;
  readonly sourcePath: string;
  readonly targetGlob: string;
}
