# Implementation Tasks

FEATURE: Schema Validation for awa validate
SOURCE: PLAN-011-schema-validation.md

## Phase 1: Setup

- [x] T-VAL-100 Research and select lightweight YAML parser (evaluate `yaml`, `smol-yaml`, or alternatives) → package.json
- [x] T-VAL-101 Add `unified` and `remark-parse` dependencies → package.json
- [x] T-VAL-102 Add chosen YAML parser dependency → package.json

## Phase 2: Foundation

- [x] T-VAL-110 Define rule file types (`RuleFile`, `SectionRule`, `ContainsRule`, `ListRule`, `TableRule`) → src/core/validate/rule-types.ts
- [x] T-VAL-111 Add schema-related finding codes to `FindingCode` type (`schema-missing-section`, `schema-wrong-level`, `schema-missing-content`, `schema-table-columns`, `schema-prohibited`, `schema-no-rule`) → src/core/validate/types.ts
- [x] T-VAL-112 Add `schemaDir` and `schemaEnabled` fields to `ValidateConfig` and `DEFAULT_VALIDATE_CONFIG` → src/core/validate/types.ts

## Phase 3: Rule Loader [MUST]

GOAL: Load and parse *.rules.yaml files into typed rule definitions
TEST CRITERIA: Can parse valid YAML rule files, reject malformed rules, match target-files to spec paths

- [x] T-VAL-120 Implement rule file discovery — glob `{schemaDir}/*.rules.yaml` → src/core/validate/rule-loader.ts
- [x] T-VAL-121 Implement YAML parsing into typed `RuleFile` definitions → src/core/validate/rule-loader.ts
- [x] T-VAL-122 Implement target-files pattern matching — resolve which Markdown files each rule set applies to → src/core/validate/rule-loader.ts
- [x] T-VAL-123 Implement rule validation — detect invalid regex in `pattern` fields, missing required properties → src/core/validate/rule-loader.ts
- [x] T-VAL-124 [P] Test rule loader with valid rule files → src/core/validate/__tests__/rule-loader.test.ts
- [x] T-VAL-125 [P] Test rule loader rejects malformed YAML and invalid patterns → src/core/validate/__tests__/rule-loader.test.ts
- [x] T-VAL-126 [P] Test target-files glob matching resolves correctly → src/core/validate/__tests__/rule-loader.test.ts

## Phase 4: Schema Checker [MUST]

GOAL: Parse Markdown into mdast and check against loaded rules
TEST CRITERIA: Detects missing sections, wrong levels, missing content, bad table columns, prohibited patterns

- [x] T-VAL-130 Implement Markdown → mdast parsing via remark (unified pipeline) → src/core/validate/schema-checker.ts
- [x] T-VAL-131 Implement heading tree builder — walk mdast to extract heading hierarchy with section content ranges → src/core/validate/schema-checker.ts
- [x] T-VAL-132 Implement required section checking — required headings present at correct level → src/core/validate/schema-checker.ts
- [x] T-VAL-133 Implement `contains.pattern` checking — regex must appear in section body → src/core/validate/schema-checker.ts
- [x] T-VAL-134 Implement `contains.list` checking — list items matching pattern with min count → src/core/validate/schema-checker.ts
- [x] T-VAL-135 Implement `contains.table` checking — table with expected column headers and min rows → src/core/validate/schema-checker.ts
- [x] T-VAL-136 Implement `contains.code-block` checking — at least one fenced code block present → src/core/validate/schema-checker.ts
- [x] T-VAL-137 Implement `sections-prohibited` checking — formatting patterns that should not appear → src/core/validate/schema-checker.ts
- [x] T-VAL-138 Implement `children` and `repeatable` section matching — nested section rules under parent headings → src/core/validate/schema-checker.ts
- [x] T-VAL-139 [P] Test missing required section detection → src/core/validate/__tests__/schema-checker.test.ts
- [x] T-VAL-140 [P] Test wrong heading level detection → src/core/validate/__tests__/schema-checker.test.ts
- [x] T-VAL-141 [P] Test contains.pattern matching → src/core/validate/__tests__/schema-checker.test.ts
- [x] T-VAL-142 [P] Test contains.list matching with min count → src/core/validate/__tests__/schema-checker.test.ts
- [x] T-VAL-143 [P] Test contains.table column validation → src/core/validate/__tests__/schema-checker.test.ts
- [x] T-VAL-144 [P] Test contains.code-block detection → src/core/validate/__tests__/schema-checker.test.ts
- [x] T-VAL-145 [P] Test sections-prohibited enforcement → src/core/validate/__tests__/schema-checker.test.ts
- [x] T-VAL-146 [P] Test children and repeatable section matching → src/core/validate/__tests__/schema-checker.test.ts
- [x] T-VAL-147 [P] Test valid Markdown file produces no findings → src/core/validate/__tests__/schema-checker.test.ts

## Phase 5: Integration [MUST]

GOAL: Wire rule loading and schema checking into the validate command pipeline
TEST CRITERIA: `awa validate` loads rules, reports schema findings alongside marker/cross-ref findings, respects config

- [x] T-VAL-150 Parse `schema-dir` and `schema-enabled` from `[validate]` TOML section in config builder → src/commands/validate.ts
- [x] T-VAL-151 Wire rule loading into validate pipeline — call `loadRules` after config, parallel with scanMarkers/parseSpecs → src/commands/validate.ts
- [x] T-VAL-152 Wire schema checker into validate pipeline — run in parallel with codeSpecChecker and specSpecChecker → src/commands/validate.ts
- [x] T-VAL-153 Add schema finding codes to text reporter formatting → src/core/validate/reporter.ts
- [x] T-VAL-154 Add schema finding codes to JSON reporter output → src/core/validate/reporter.ts
- [x] T-VAL-155 Support `schema-enabled = false` to skip schema checking entirely → src/commands/validate.ts
- [x] T-VAL-156 [P] Integration test: validate with sample rules.yaml + conforming Markdown → src/commands/__tests__/validate.test.ts
- [x] T-VAL-157 [P] Integration test: validate with sample rules.yaml + non-conforming Markdown → src/commands/__tests__/validate.test.ts
- [x] T-VAL-158 [P] Integration test: validate with schema-enabled = false skips schema checking → src/commands/__tests__/validate.test.ts

## Phase 6: Documentation

- [x] T-VAL-160 Create schema rules format reference → docs/SCHEMA_RULES.md
- [x] T-VAL-161 Update CLI reference with schema validation options → docs/CLI.md
- [x] T-VAL-162 Update traceability validation guide with schema validation section → docs/TRACEABILITY_VALIDATION.md
- [x] T-VAL-163 Update ARCHITECTURE.md with VAL-RuleLoader and VAL-SchemaChecker components → .awa/specs/ARCHITECTURE.md
- [x] T-VAL-164 Update website CLI reference → website/src/content/docs/cli.mdx
- [x] T-VAL-165 Update website configuration page → website/src/content/docs/configuration.md
- [x] T-VAL-166 Update website traceability guide → website/src/content/docs/guides/traceability.md

---

## Dependencies

Phase 1 → (none)
Phase 2 → Phase 1 (needs YAML parser and remark deps installed)
Phase 3 → Phase 2 (needs rule types defined)
Phase 4 → Phase 2 (needs rule types and finding codes defined)
Phase 5 → Phase 3, Phase 4 (needs loader and checker implemented)
Phase 6 → Phase 5 (documents completed feature)

## Parallel Opportunities

Phase 2: T-VAL-110, T-VAL-111, T-VAL-112 all parallelizable
Phase 3: T-VAL-124, T-VAL-125, T-VAL-126 can run parallel after T-VAL-123
Phase 4: T-VAL-130 through T-VAL-138 are sequential (build on each other); T-VAL-139 through T-VAL-147 all parallelizable after T-VAL-138
Phase 5: T-VAL-153, T-VAL-154 can run parallel; T-VAL-156, T-VAL-157, T-VAL-158 can run parallel after T-VAL-155
Phase 6: T-VAL-160 through T-VAL-166 all parallelizable

## Trace Summary

SOURCE: PLAN-011-schema-validation.md (no formal REQ/DESIGN — plan-sourced tasks)

| Plan Phase | Tasks | Tests |
|---|---|---|
| Phase 1: Rule Loader | T-VAL-120 through T-VAL-123 | T-VAL-124, T-VAL-125, T-VAL-126 |
| Phase 2: Schema Checker | T-VAL-130 through T-VAL-138 | T-VAL-139 through T-VAL-147 |
| Phase 3: Integration | T-VAL-150 through T-VAL-155 | T-VAL-156, T-VAL-157, T-VAL-158 |
| Phase 4: Documentation | T-VAL-160 through T-VAL-166 | — |

UNCOVERED: (none — all plan phases have implementation + test tasks)
