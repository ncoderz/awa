// @awa-component: VAL-RuleLoader

/**
 * Types for declarative YAML rule files that define structural
 * expectations for Markdown spec documents.
 */

/** A contains rule that checks for a regex pattern in section body. */
export interface PatternContainsRule {
  readonly pattern: string;
  readonly label?: string;
  readonly required?: boolean;
}

/** A contains rule that checks for list items matching a pattern. */
export interface ListContainsRule {
  readonly list: {
    readonly pattern: string;
    readonly min?: number;
    readonly label?: string;
  };
}

/** A contains rule that checks table structure. */
export interface TableContainsRule {
  readonly table: {
    readonly heading?: string;
    readonly columns: readonly string[];
    readonly 'min-rows'?: number;
  };
}

/** A contains rule that checks for at least one fenced code block. */
export interface CodeBlockContainsRule {
  readonly 'code-block': true;
  readonly label?: string;
}

/** A contains rule that checks for a heading or text label. */
export interface HeadingOrTextContainsRule {
  readonly 'heading-or-text': string;
  readonly required?: boolean;
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
  readonly children?: readonly SectionRule[];
  readonly contains?: readonly ContainsRule[];
}

/** A complete rule file parsed from YAML. */
export interface RuleFile {
  readonly 'target-files': string;
  readonly sections: readonly SectionRule[];
  readonly 'sections-prohibited'?: readonly string[];
}

/** A loaded and validated rule set with resolved file matching. */
export interface LoadedRuleSet {
  readonly ruleFile: RuleFile;
  readonly sourcePath: string;
  readonly targetGlob: string;
}
