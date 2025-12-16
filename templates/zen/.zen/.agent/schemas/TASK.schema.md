<schema target-files=".zen/tasks/TASK-{code}-{feature-name}-{nnn}.md">

```json
{
  "description": "Implementation tasks only. Dependency-ordered. Traceable to REQ and DESIGN.",
  "required": ["feature", "source", "phases", "dependencies", "traceSummary"],
  "properties": {
    "feature": { "type": "feature name from REQ" },
    "source": { "type": "array of source file paths (REQ, DESIGN)" },
    "phases": { "type": "array", "items": { "$ref": "#/$defs/phase" } },
    "dependencies": { "type": "array", "items": { "$ref": "#/$defs/dependency" } },
    "parallelOpportunities": { "type": "array", "items": { "properties": { "phase": {}, "tasks": { "type": "array of task IDs" }, "notes": {} } } },
    "traceSummary": {
      "required": ["acCoverage", "propertyCoverage"],
      "properties": {
        "acCoverage": { "type": "array", "items": { "properties": { "ac": {}, "task": {}, "test": {} } } },
        "propertyCoverage": { "type": "array", "items": { "properties": { "property": {}, "test": {} } } },
        "uncovered": { "type": "array of AC or P IDs" }
      }
    }
  },
  "$defs": {
    "phase": {
      "required": ["name", "tasks"],
      "properties": {
        "name": { "type": "phase name" },
        "type": { "enum": ["setup", "foundation", "requirement", "polish"] },
        "requirement": { "type": "REQ-{code}-{n} (only for requirement phases)" },
        "priority": { "enum": ["must", "should", "could"] },
        "goal": { "type": "requirement's story.want (only for requirement phases)" },
        "testCriteria": { "type": "how to verify phase is complete" },
        "tasks": { "type": "array", "items": { "$ref": "#/$defs/task" } }
      }
    },
    "task": {
      "required": ["id", "description", "path"],
      "properties": {
        "id": { "type": "pattern: T-{code}-{nnn} (e.g., T-cfg-001)" },
        "parallel": { "type": "boolean, true if parallelizable" },
        "requirement": { "type": "REQ-{code}-{n} (only in requirement phases)" },
        "description": { "type": "clear action" },
        "path": { "type": "target file path" },
        "implements": { "type": "array of AC-{code}-{n}.{m}" },
        "tests": { "type": "array of P-{code}-{n} or AC-{code}-{n}.{m}" }
      }
    },
    "dependency": {
      "required": ["requirement", "dependsOn"],
      "properties": {
        "requirement": { "type": "REQ-{code}-{n}" },
        "dependsOn": { "type": "array of REQ-{code}-{n} or empty" },
        "reason": { "type": "why dependency exists" }
      }
    }
  },
  "$render": {
    "template": "# Implementation Tasks\n\nFEATURE: {feature}\nSOURCE: {source}\n\n{phases→'## {name} {[priority]?}\n\n{goal→\"GOAL: {}\"}\n{testCriteria→\"TEST CRITERIA: {}\"}\n\n{tasks→\"- [ ] {id} {[P]?} {[requirement]?} {description} → {path}\n      {implements→\\\"IMPLEMENTS: {}\\\"}\n      {tests→\\\"TESTS: {}\\\"}\"}'}\n\n---\n\n## Dependencies\n{dependencies→'{requirement} → {dependsOn|\"(none)\"} {reason?}'}\n\n## Parallel Opportunities\n{parallelOpportunities→'{phase}: {tasks} {notes?}'}\n\n## Trace Summary\n\n| AC | Task | Test |\n|----|------|------|\n{traceSummary.acCoverage→'| {ac} | {task} | {test} |'}\n\n| Property | Test |\n|----------|------|\n{traceSummary.propertyCoverage→'| {property} | {test} |'}\n\nUNCOVERED: {traceSummary.uncovered|\"(none)\"}",
    "omit": ["[P] if parallel false/absent", "[requirement] if absent", "[priority] if absent", "GOAL if absent", "TEST CRITERIA if absent", "IMPLEMENTS line if empty", "TESTS line if empty", "reason if absent", "notes if absent"],
    "prohibited": ["**bold** — use CAPITALS", "tasks without file paths", "IMPLEMENTS/TESTS on setup tasks", "[requirement] labels on setup/foundation/polish phases", "orphan tasks (must trace to AC or P)"],
    "checkbox": "[ ] always unchecked in generated output"
  }
}
```

<example>
# Implementation Tasks

FEATURE: Configuration System
SOURCE: REQ-cfg-config.md, DESIGN-cfg-config.md

## Phase 1: Setup

- [ ] T-cfg-001 Initialize module structure → src/config/
- [ ] T-cfg-002 [P] Add dependencies (smol-toml) → package.json

## Phase 2: Foundation

- [ ] T-cfg-003 Define Config and RawConfig types → src/config/types.ts
- [ ] T-cfg-004 Define ConfigError variants → src/config/errors.ts

## Phase 3: Config Loading [MUST]

GOAL: Load and merge configuration from file with defaults
TEST CRITERIA: Can load valid TOML, missing keys get defaults

- [ ] T-cfg-010 [REQ-cfg-1] Implement load function → src/config/loader.ts
      IMPLEMENTS: AC-cfg-1.1
- [ ] T-cfg-011 [REQ-cfg-1] Implement merge function → src/config/loader.ts
      IMPLEMENTS: AC-cfg-1.2
- [ ] T-cfg-012 [P] [REQ-cfg-1] Property test for default preservation → tests/config/loader.test.ts
      TESTS: P-cfg-1
- [ ] T-cfg-013 [P] [REQ-cfg-1] Test load from valid path → tests/config/loader.test.ts
      TESTS: AC-cfg-1.1

## Phase 4: Config Validation [SHOULD]

GOAL: Validate loaded config against schema
TEST CRITERIA: Invalid config rejected with clear error

- [ ] T-cfg-020 [REQ-cfg-2] Implement validate function → src/config/validator.ts
      IMPLEMENTS: AC-cfg-2.1
- [ ] T-cfg-021 [P] [REQ-cfg-2] Test schema validation → tests/config/validator.test.ts
      TESTS: AC-cfg-2.1

## Phase 5: Polish

- [ ] T-cfg-030 Integration test: load → validate → use → tests/config/integration.test.ts
      TESTS: AC-cfg-1.1, AC-cfg-2.1

---

## Dependencies

REQ-cfg-1 → (none)
REQ-cfg-2 → REQ-cfg-1 (validates loaded config)

## Parallel Opportunities

Phase 3: T-cfg-012, T-cfg-013 can run parallel after T-cfg-011
Phase 4: T-cfg-021 can run parallel with T-cfg-020

## Trace Summary

| AC | Task | Test |
|----|------|------|
| AC-cfg-1.1 | T-cfg-010 | T-cfg-013 |
| AC-cfg-1.2 | T-cfg-011 | T-cfg-012 |
| AC-cfg-2.1 | T-cfg-020 | T-cfg-021 |

| Property | Test |
|----------|------|
| P-cfg-1 | T-cfg-012 |

UNCOVERED: (none)
</example>

</schema>