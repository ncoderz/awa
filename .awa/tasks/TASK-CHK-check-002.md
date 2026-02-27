# Implementation Tasks

FEATURE: Schema Validation for awa check
SOURCE: PLAN-011-schema-check.md

## Phase 1: Setup

- [x] T-CHK-100 Research and select lightweight YAML parser (evaluate `yaml`, `smol-yaml`, or alternatives) → package.json
- [x] T-CHK-101 Add `unified` and `remark-parse` dependencies → package.json
- [x] T-CHK-102 Add chosen YAML parser dependency → package.json

## Phase 2: Foundation

- [x] T-CHK-110 Define rule file types (`RuleFile`, `SectionRule`, `ContainsRule`, `ListRule`, `TableRule`) → src/core/check/rule-types.ts
- [x] T-CHK-111 Add schema-related finding codes to `FindingCode` type (`schema-missing-section`, `schema-wrong-level`, `schema-missing-content`, `schema-table-columns`, `schema-prohibited`, `schema-no-rule`) → src/core/check/types.ts
- [x] T-CHK-112 Add `schemaDir` and `schemaEnabled` fields to `CheckConfig` and `DEFAULT_CHECK_CONFIG` → src/core/check/types.ts

## Phase 3: Rule Loader [MUST]

GOAL: Load and parse *.rules.yaml files into typed rule definitions
TEST CRITERIA: Can parse valid YAML rule files, reject malformed rules, match target-files to spec paths

- [x] T-CHK-120 Implement rule file discovery — glob `{schemaDir}/*.rules.yaml` → src/core/check/rule-loader.ts
- [x] T-CHK-121 Implement YAML parsing into typed `RuleFile` definitions → src/core/check/rule-loader.ts
- [x] T-CHK-122 Implement target-files pattern matching — resolve which Markdown files each rule set applies to → src/core/check/rule-loader.ts
- [x] T-CHK-123 Implement rule validation — detect invalid regex in `pattern` fields, missing required properties → src/core/check/rule-loader.ts
- [x] T-CHK-124 [P] Test rule loader with valid rule files → src/core/check/__tests__/rule-loader.test.ts
- [x] T-CHK-125 [P] Test rule loader rejects malformed YAML and invalid patterns → src/core/check/__tests__/rule-loader.test.ts
- [x] T-CHK-126 [P] Test target-files glob matching resolves correctly → src/core/check/__tests__/rule-loader.test.ts

## Phase 4: Schema Checker [MUST]

GOAL: Parse Markdown into mdast and check against loaded rules
TEST CRITERIA: Detects missing sections, wrong levels, missing content, bad table columns, prohibited patterns

- [x] T-CHK-130 Implement Markdown → mdast parsing via remark (unified pipeline) → src/core/check/schema-checker.ts
- [x] T-CHK-131 Implement heading tree builder — walk mdast to extract heading hierarchy with section content ranges → src/core/check/schema-checker.ts
- [x] T-CHK-132 Implement required section checking — required headings present at correct level → src/core/check/schema-checker.ts
- [x] T-CHK-133 Implement `contains.pattern` checking — regex must appear in section body → src/core/check/schema-checker.ts
- [x] T-CHK-134 Implement `contains.list` checking — list items matching pattern with min count → src/core/check/schema-checker.ts
- [x] T-CHK-135 Implement `contains.table` checking — table with expected column headers and min rows → src/core/check/schema-checker.ts
- [x] T-CHK-136 Implement `contains.code-block` checking — at least one fenced code block present → src/core/check/schema-checker.ts
- [x] T-CHK-137 Implement `sections-prohibited` checking — formatting patterns that should not appear → src/core/check/schema-checker.ts
- [x] T-CHK-138 Implement `children` and `repeatable` section matching — nested section rules under parent headings → src/core/check/schema-checker.ts
- [x] T-CHK-139 [P] Test missing required section detection → src/core/check/__tests__/schema-checker.test.ts
- [x] T-CHK-140 [P] Test wrong heading level detection → src/core/check/__tests__/schema-checker.test.ts
- [x] T-CHK-141 [P] Test contains.pattern matching → src/core/check/__tests__/schema-checker.test.ts
- [x] T-CHK-142 [P] Test contains.list matching with min count → src/core/check/__tests__/schema-checker.test.ts
- [x] T-CHK-143 [P] Test contains.table column validation → src/core/check/__tests__/schema-checker.test.ts
- [x] T-CHK-144 [P] Test contains.code-block detection → src/core/check/__tests__/schema-checker.test.ts
- [x] T-CHK-145 [P] Test sections-prohibited enforcement → src/core/check/__tests__/schema-checker.test.ts
- [x] T-CHK-146 [P] Test children and repeatable section matching → src/core/check/__tests__/schema-checker.test.ts
- [x] T-CHK-147 [P] Test valid Markdown file produces no findings → src/core/check/__tests__/schema-checker.test.ts

## Phase 5: Integration [MUST]

GOAL: Wire rule loading and schema checking into the check command pipeline
TEST CRITERIA: `awa check` loads rules, reports schema findings alongside marker/cross-ref findings, respects config

- [x] T-CHK-150 Parse `schema-dir` and `schema-enabled` from `[check]` TOML section in config builder → src/commands/check.ts
- [x] T-CHK-151 Wire rule loading into validate pipeline — call `loadRules` after config, parallel with scanMarkers/parseSpecs → src/commands/check.ts
- [x] T-CHK-152 Wire schema checker into validate pipeline — run in parallel with codeSpecChecker and specSpecChecker → src/commands/check.ts
- [x] T-CHK-153 Add schema finding codes to text reporter formatting → src/core/check/reporter.ts
- [x] T-CHK-154 Add schema finding codes to JSON reporter output → src/core/check/reporter.ts
- [x] T-CHK-155 Support `schema-enabled = false` to skip schema checking entirely → src/commands/check.ts
- [x] T-CHK-156 [P] Integration test: validate with sample rules.yaml + conforming Markdown → src/commands/__tests__/check.test.ts
- [x] T-CHK-157 [P] Integration test: validate with sample rules.yaml + non-conforming Markdown → src/commands/__tests__/check.test.ts
- [x] T-CHK-158 [P] Integration test: validate with schema-enabled = false skips schema checking → src/commands/__tests__/check.test.ts

## Phase 6: Documentation

- [x] T-CHK-160 Create schema rules format reference → docs/SCHEMA_RULES.md
- [x] T-CHK-161 Update CLI reference with schema validation options → docs/CLI.md
- [x] T-CHK-162 Update traceability validation guide with schema validation section → docs/TRACEABILITY_VALIDATION.md
- [x] T-CHK-163 Update ARCHITECTURE.md with CHK-RuleLoader and CHK-SchemaChecker components → .awa/specs/ARCHITECTURE.md
- [x] T-CHK-164 Update website CLI reference → website/src/content/docs/cli.mdx
- [x] T-CHK-165 Update website configuration page → website/src/content/docs/configuration.md
- [x] T-CHK-166 Update website traceability guide → website/src/content/docs/guides/traceability.md

---

## Dependencies

Phase 1 → (none)
Phase 2 → Phase 1 (needs YAML parser and remark deps installed)
Phase 3 → Phase 2 (needs rule types defined)
Phase 4 → Phase 2 (needs rule types and finding codes defined)
Phase 5 → Phase 3, Phase 4 (needs loader and checker implemented)
Phase 6 → Phase 5 (documents completed feature)

## Parallel Opportunities

Phase 2: T-CHK-110, T-CHK-111, T-CHK-112 all parallelizable
Phase 3: T-CHK-124, T-CHK-125, T-CHK-126 can run parallel after T-CHK-123
Phase 4: T-CHK-130 through T-CHK-138 are sequential (build on each other); T-CHK-139 through T-CHK-147 all parallelizable after T-CHK-138
Phase 5: T-CHK-153, T-CHK-154 can run parallel; T-CHK-156, T-CHK-157, T-CHK-158 can run parallel after T-CHK-155
Phase 6: T-CHK-160 through T-CHK-166 all parallelizable

## Trace Summary

SOURCE: PLAN-011-schema-check.md (no formal REQ/DESIGN — plan-sourced tasks)

| Plan Phase | Tasks | Tests |
|---|---|---|
| Phase 1: Rule Loader | T-CHK-120 through T-CHK-123 | T-CHK-124, T-CHK-125, T-CHK-126 |
| Phase 2: Schema Checker | T-CHK-130 through T-CHK-138 | T-CHK-139 through T-CHK-147 |
| Phase 3: Integration | T-CHK-150 through T-CHK-155 | T-CHK-156, T-CHK-157, T-CHK-158 |
| Phase 4: Documentation | T-CHK-160 through T-CHK-166 | — |

UNCOVERED: (none — all plan phases have implementation + test tasks)
