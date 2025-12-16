<schema target="chat-output">

<definitions>
  x = source artifact (what is being validated).
  y = target artifact (what x is validated against).
  <severity>
    CRITICAL: MUST/SHALL violation, security, data integrity
    MAJOR: SHOULD violation, UX, performance
    MINOR: MAY not implemented, orphan traces, optional
    INFO: superset additions, suggestions
  </severity>
  <confidence>
    CERTAIN: explicit trace (IMPLEMENTS, VALIDATES, @zen-*)
    LIKELY: naming convention or strong inference
    UNCERTAIN: semantic inference only → flag for human review
  </confidence>
  <finding-type>
    MISSING | DIFFERENCE | CONFLICT | INCOMPLETE | UNTESTED | ORPHAN | SUPERSET
  </finding-type>
  <trace_matrix>
    <trace in="DESIGN component" marker="IMPLEMENTS: AC-{code}-{n}.{m}" to="REQ AC" />
    <trace in="DESIGN property" marker="P-{code}-{n} VALIDATES: AC-{code}-{n}.{m} | REQ-{code}-{n}" to="REQ" />
    <trace in="code" marker="@zen-component: {code}-{ComponentName}" to="DESIGN component" />
    <trace in="code" marker="@zen-impl: AC-{code}-{n}.{m}" to="REQ AC" />
    <trace in="tests" marker="@zen-test: P-{code}-{n}" to="DESIGN property" />
    <trace in="tests" marker="@zen-test: AC-{code}-{n}.{m}" to="REQ AC" />
    <infer target="semantic_traces" when="markers missing" confidence="LIKELY|UNCERTAIN" />
  </trace_matrix>
</definitions>

```json
{
  "description": "Render as Markdown per $rendering.",
  "type": "object",
  "required": ["source", "target", "findings"],
  "properties": {
    "source": { "type": "string", "description": "x artifact path or identifier" },
    "target": { "type": "string", "description": "y artifact path or identifier" },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["severity", "confidence", "type", "sourceRef", "details"],
        "properties": {
          "severity": { "enum": ["critical", "major", "minor", "info"] },
          "confidence": { "enum": ["certain", "likely", "uncertain"] },
          "type": { "enum": ["missing", "difference", "conflict", "incomplete", "superset", "orphan", "untested"] },
          "sourceRef": {
            "type": "object",
            "required": ["location"],
            "properties": {
              "location": { "type": "string" },
              "text": { "type": "string" }
            }
          },
          "targetRef": {
            "type": "object",
            "properties": {
              "location": { "type": "string" },
              "text": { "type": "string" }
            }
          },
          "details": { "type": "string" },
          "traceability": { "enum": ["explicit-implements", "explicit-validates", "explicit-zen-component", "explicit-zen-impl", "explicit-zen-test", "naming", "semantic"], "description": "How the trace was established" },
          "resolution": { "type": "string" }
        }
      }
    }
  },
  "$rendering": {
    "templates": {
      "withFindings": [
        "# ALIGNMENT REPORT",
        "{source} ↔ {target}",
        "---",
        "{for each finding: templates.finding}",
        "---",
        "## Summary",
        "| Severity | Count |",
        "|----------|-------|",
        "| CRITICAL | {count} |",
        "| MAJOR | {count} |",
        "| MINOR | {count} |",
        "| INFO | {count} |",
        "**STATUS: {PASSED ✅ | FAILED ❌}**"
      ],
      "noFindings": [
        "# ALIGNMENT REPORT",
        "{source} ↔ {target}",
        "All checks passed. No alignment issues found.",
        "**STATUS: PASSED ✅**"
      ],
      "finding": [
        "### {n}. {SEVERITY} [{CONFIDENCE}] {TYPE}",
        "**Source:** {sourceRef.location}",
        "> {sourceRef.text}",
        "**Target:** {targetRef.location}",
        "> {targetRef.text}",
        "{details}",
        "**Resolution:** {resolution}",
        "*Traced via: {traceability}*"
      ]
    },
    "statusRules": [
      "FAILED if any CRITICAL or MAJOR findings",
      "PASSED otherwise"
    ],
    "templateSelection": [
      "No findings → noFindings",
      "Findings exist → withFindings"
    ],
    "omissionRules": [
      "Omit source blockquote if sourceRef.text absent",
      "Omit **Target:** if targetRef absent → show '**Target:** (not found)'",
      "Omit target blockquote if targetRef.text absent",
      "Omit *Traced via* if traceability starts with 'explicit-'",
      "Omit **Resolution:** if resolution absent"
    ]
  }
}
```

<example>
# ALIGNMENT REPORT

DESIGN-wks-workspace.md ↔ src/workspace/**

---

### 1. CRITICAL [CERTAIN] MISSING

**Source:** wks-WorkspaceConfig (IMPLEMENTS: AC-wks-1.1)
> pub fn load(root: &Path) -> Result<Self, WorkspaceError>

**Target:** (not found)

Design component declares IMPLEMENTS: AC-wks-1.1, but no code file contains @zen-component: wks-WorkspaceConfig with @zen-impl: AC-wks-1.1.

**Resolution:** Add @zen-component: wks-WorkspaceConfig and @zen-impl: AC-wks-1.1 to src/workspace/config.rs

---

### 2. MAJOR [CERTAIN] UNTESTED

**Source:** P-wks-2
> For any valid EngineLibrary, the crate SHALL contain zero binary targets

**Target:** (not found)

Property P-wks-2 exists in design but no test file contains @zen-test: P-wks-2.

**Resolution:** Add test with @zen-test: P-wks-2 marker

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| MAJOR | 1 |
| MINOR | 0 |
| INFO | 0 |

**STATUS: FAILED ❌**
</example>

</schema>