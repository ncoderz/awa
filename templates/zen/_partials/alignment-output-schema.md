```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LLM Alignment Report Schema",
  "description": "RENDERING RULES: Uses markdown for rendered output. ### for finding headers, > blockquotes for quoted source/target text, **bold** for labels (Source/Target/Resolution), --- for separators, table for summary. Severity inferred from RFC 2119 keywords: MUST/SHALL→CRITICAL, SHOULD→MAJOR, MAY→MINOR. Always report confidence level. PROHIBITED: Excessive formatting, nested blockquotes.",
  "type": "object",
  "additionalProperties": false,
  "required": ["source", "target", "findings"],
  "properties": {
    "source": {
      "type": "string",
      "description": "Source artifact path or identifier (e.g., REQ-workspace.md, DESIGN-workspace.md)",
      "$comment": "RENDER: Subtitle under # ALIGNMENT REPORT"
    },
    "target": {
      "type": "string",
      "description": "Target artifact path or identifier (e.g., DESIGN-workspace.md, src/workspace/**)",
      "$comment": "RENDER: Subtitle '{source} ↔ {target}'"
    },
    "findings": {
      "type": "array",
      "items": { "$ref": "#/definitions/finding" },
      "$comment": "RENDER: Each finding as ### header with details"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "generatedAt": { "type": "string", "format": "date-time" },
        "toolVersion": { "type": "string" }
      }
    }
  },
  "definitions": {
    "finding": {
      "type": "object",
      "additionalProperties": false,
      "required": ["severity", "confidence", "type", "sourceRef", "details"],
      "$comment": "RENDER: '### {n}. {SEVERITY} [{CONFIDENCE}] {TYPE}'",
      "properties": {
        "severity": {
          "type": "string",
          "enum": ["critical", "major", "minor", "info"],
          "$comment": "RENDER: Uppercase in header"
        },
        "confidence": {
          "type": "string",
          "enum": ["certain", "likely", "uncertain"],
          "$comment": "RENDER: Uppercase in brackets [CERTAIN]"
        },
        "type": {
          "type": "string",
          "enum": ["missing", "difference", "conflict", "incomplete", "superset", "orphan", "untested"],
          "$comment": "RENDER: Uppercase in header"
        },
        "sourceRef": {
          "type": "object",
          "additionalProperties": false,
          "required": ["location"],
          "properties": {
            "location": {
              "type": "string",
              "description": "File path, requirement ID (WS-1), AC ID (AC-1.1), property ID (P1), or component name"
            },
            "text": {
              "type": "string",
              "description": "Relevant text from source (EARS statement, property description, code)"
            }
          },
          "$comment": "RENDER: '**Source:** {location}' followed by '> {text}' blockquote if text present"
        },
        "targetRef": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "location": {
              "type": "string",
              "description": "File path, component name, property ID, or code location"
            },
            "text": {
              "type": "string",
              "description": "Relevant text/code from target"
            }
          },
          "$comment": "RENDER: '**Target:** {location}' or '**Target:** (not found)' if absent, followed by '> {text}' blockquote if text present"
        },
        "details": {
          "type": "string",
          "description": "Explanation of the finding",
          "$comment": "RENDER: Paragraph after Source/Target"
        },
        "traceability": {
          "type": "string",
          "enum": ["explicit-implements", "explicit-validates", "explicit-traceability-matrix", "explicit-zen-component", "explicit-zen-impl", "explicit-zen-test", "naming", "semantic"],
          "$comment": "RENDER: '*Traced via: {traceability}*' - omit if starts with 'explicit-'"
        },
        "resolution": {
          "type": "string",
          "description": "Suggested fix or action",
          "$comment": "RENDER: '**Resolution:** {text}' - omit if absent"
        }
      }
    }
  },
  "$sourceFormats": {
    "_comment": "Reference formats for source artifacts this schema aligns against",
    "requirements": {
      "file": "REQ-{feature}.md",
      "requirementId": "{PREFIX}-{n} (e.g., WS-1, ENG-1)",
      "criterionId": "AC-{n}.{m} (e.g., AC-1.1, AC-1.2)",
      "criterionFormat": "- {AC-id} [{type}]: {EARS statement}",
      "criterionTypes": ["ubiquitous", "event", "state", "conditional", "optional", "complex"],
      "earsKeywords": {
        "triggers": ["WHEN", "WHILE", "IF", "WHERE"],
        "obligations": ["SHALL", "SHALL NOT", "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", "MAY"],
        "response": ["THEN"]
      }
    },
    "design": {
      "file": "DESIGN-{feature}.md",
      "propertyId": "P{n} (e.g., P1, P2)",
      "componentTrace": "IMPLEMENTS: {AC-ids}",
      "propertyTrace": "VALIDATES: {REQ-ids and/or AC-ids}",
      "traceabilityMatrix": "- {AC-id} → {Component} (P{n}) [{status}]"
    },
    "code": {
      "markers": {
        "component": "@zen-component: {ComponentName}",
        "implementation": "@zen-impl: {AC-ids}",
        "test": "@zen-test: {P-ids}"
      },
      "placement": {
        "fileHeader": "Module-level scope, applies to all functions unless overridden",
        "function": "Function-level scope, overrides file header"
      },
      "patterns": {
        "rust": ["//! @zen-*", "/// @zen-*", "// @zen-*"],
        "typescript": ["// @zen-*", "/** @zen-* */"],
        "python": ["# @zen-*"],
        "go": ["// @zen-*"]
      }
    }
  },
  "$traceabilityRules": {
    "_comment": "How to identify explicit traces between artifacts",
    "explicitTraces": [
      "IMPLEMENTS: AC-x.y in design components → links design to requirements",
      "VALIDATES: REQ-x, AC-x.y in correctness properties → links properties to requirements",
      "Traceability matrix entries in design → summarizes design coverage",
      "@zen-component: X in code → links code to design component",
      "@zen-impl: AC-x.y in code → links code to requirements",
      "@zen-test: P{n} in test code → links tests to design properties"
    ],
    "namingConventions": [
      "REQ-{name}.md ↔ DESIGN-{name}.md (matching feature name)",
      "DESIGN-{name}.md ↔ src/{name}/** (directory matches)",
      "AC-{n}.{m} in requirements ↔ IMPLEMENTS: AC-{n}.{m} in design ↔ @zen-impl: AC-{n}.{m} in code"
    ],
    "traceChain": [
      "Requirement ({PREFIX}-{n})",
      "  → Acceptance Criterion (AC-{n}.{m})",
      "    → Design Component (via IMPLEMENTS)",
      "      → Code Module (via @zen-component + @zen-impl)",
      "    → Correctness Property (P{n} via VALIDATES)",
      "      → Test Function (via @zen-test)"
    ],
    "codeValidation": {
      "rules": [
        "@zen-impl MUST NOT appear on test functions",
        "@zen-test MUST NOT appear on non-test functions",
        "@zen-component MUST appear at file level only",
        "Component name MUST match a component in DESIGN-*.md",
        "AC IDs MUST exist in REQ-*.md",
        "Property IDs MUST exist in DESIGN-*.md"
      ],
      "coverageChecks": [
        "Every AC in design IMPLEMENTS → MUST have @zen-impl in code",
        "Every component in design → MUST have @zen-component in code",
        "Every property in design → MUST have @zen-test in tests",
        "Every @zen-impl → MUST trace back to design IMPLEMENTS",
        "Every @zen-component → MUST match design component"
      ]
    }
  },
  "$severityInference": {
    "_comment": "Rules for determining severity from source artifacts",
    "fromRFC2119": [
      "SHALL, SHALL NOT, MUST, MUST NOT → CRITICAL",
      "SHOULD, SHOULD NOT, RECOMMENDED → MAJOR",
      "MAY, OPTIONAL → MINOR"
    ],
    "fromEARSPattern": [
      "WHEN {trigger} THEN system SHALL → CRITICAL (event-driven obligation)",
      "WHILE {state} system SHALL → CRITICAL (state-driven obligation)",
      "IF {condition} THEN system SHALL → CRITICAL (conditional obligation)",
      "System SHALL {behavior} → CRITICAL (ubiquitous obligation)"
    ],
    "fromCriterionType": [
      "[ubiquitous] with SHALL/MUST → CRITICAL (always applies)",
      "[event] with SHALL/MUST → CRITICAL (must respond to trigger)",
      "[state] with SHALL/MUST → CRITICAL (must maintain during state)",
      "[conditional] with SHALL/MUST → CRITICAL (must apply when condition met)",
      "[optional] with MAY → MINOR (feature flag dependent)"
    ],
    "fromContext": [
      "Security, data integrity, core functionality → CRITICAL",
      "User experience, performance targets → MAJOR",
      "Convenience, optional features → MINOR",
      "Superset additions, suggestions → INFO"
    ]
  },
  "$rendering": {
    "_comment": "Rendering specification for alignment reports. Uses markdown for readability: ### for finding headers, > blockquotes for quoted text, **bold** for labels, table for summary. Keep formatting minimal and scannable.",
    "documentStructure": [
      "# ALIGNMENT REPORT",
      "{source} ↔ {target}",
      "",
      "---",
      "",
      "### {n}. {SEVERITY} [{CONFIDENCE}] {TYPE}",
      "...",
      "",
      "---",
      "",
      "## Summary",
      "..."
    ],
    "findingTemplate": [
      "### {n}. {SEVERITY} [{CONFIDENCE}] {TYPE}",
      "",
      "**Source:** {sourceRef.location}",
      "> {sourceRef.text}",
      "",
      "**Target:** {targetRef.location}",
      "> {targetRef.text}",
      "",
      "{details}",
      "",
      "**Resolution:** {resolution}",
      "",
      "*Traced via: {traceability}*"
    ],
    "summaryTemplate": [
      "## Summary",
      "",
      "| Severity | Count |",
      "|----------|-------|",
      "| CRITICAL | {count} |",
      "| MAJOR | {count} |",
      "| MINOR | {count} |",
      "| INFO | {count} |",
      "",
      "**STATUS: {PASSED ✅ | FAILED ❌}**"
    ],
    "statusRules": [
      "FAILED if any CRITICAL findings",
      "FAILED if any MAJOR findings",
      "PASSED otherwise"
    ],
    "omissionRules": [
      "Omit source blockquote if sourceRef.text absent",
      "Omit **Target:** line if targetRef absent, show '**Target:** (not found)'",
      "Omit target blockquote if targetRef.text absent",
      "Omit *Traced via* line if traceability starts with 'explicit-'",
      "Omit **Resolution:** line if resolution absent"
    ],
    "example": {
      "input": {
        "source": "DESIGN-workspace.md",
        "target": "src/workspace/**",
        "findings": [
          {
            "severity": "critical",
            "confidence": "certain",
            "type": "missing",
            "sourceRef": {
              "location": "WorkspaceConfig (IMPLEMENTS: AC-1.1)",
              "text": "pub fn load(root: &Path) -> Result<Self, WorkspaceError>"
            },
            "details": "Design component WorkspaceConfig declares IMPLEMENTS: AC-1.1, but no code file contains @zen-component: WorkspaceConfig with @zen-impl: AC-1.1.",
            "traceability": "explicit-implements",
            "resolution": "Add @zen-component: WorkspaceConfig and @zen-impl: AC-1.1 to src/workspace/config.rs"
          },
          {
            "severity": "major",
            "confidence": "certain",
            "type": "untested",
            "sourceRef": {
              "location": "P2",
              "text": "For any valid EngineLibrary, the crate SHALL contain zero binary targets"
            },
            "details": "Property P2 exists in design but no test file contains @zen-test: P2.",
            "traceability": "explicit-validates",
            "resolution": "Add test with @zen-test: P2 marker"
          },
          {
            "severity": "minor",
            "confidence": "certain",
            "type": "orphan",
            "sourceRef": {
              "location": "src/workspace/utils.rs",
              "text": "@zen-impl: AC-9.9"
            },
            "details": "Code declares @zen-impl: AC-9.9 but AC-9.9 does not exist in REQ-workspace.md and no component declares IMPLEMENTS: AC-9.9.",
            "traceability": "explicit-zen-impl",
            "resolution": "Remove orphan marker or add AC-9.9 to requirements"
          },
          {
            "severity": "info",
            "confidence": "certain",
            "type": "superset",
            "sourceRef": {
              "location": "DESIGN-workspace.md"
            },
            "targetRef": {
              "location": "src/workspace/helpers.rs",
              "text": "@zen-component: WorkspaceHelpers"
            },
            "details": "Code declares @zen-component: WorkspaceHelpers but no such component exists in design. This may be acceptable internal helper code.",
            "traceability": "explicit-zen-component"
          }
        ]
      },
      "output": "# ALIGNMENT REPORT\nDESIGN-workspace.md ↔ src/workspace/**\n\n---\n\n### 1. CRITICAL [CERTAIN] MISSING\n\n**Source:** WorkspaceConfig (IMPLEMENTS: AC-1.1)\n> pub fn load(root: &Path) -> Result<Self, WorkspaceError>\n\n**Target:** (not found)\n\nDesign component WorkspaceConfig declares IMPLEMENTS: AC-1.1, but no code file contains @zen-component: WorkspaceConfig with @zen-impl: AC-1.1.\n\n**Resolution:** Add @zen-component: WorkspaceConfig and @zen-impl: AC-1.1 to src/workspace/config.rs\n\n---\n\n### 2. MAJOR [CERTAIN] UNTESTED\n\n**Source:** P2\n> For any valid EngineLibrary, the crate SHALL contain zero binary targets\n\n**Target:** (not found)\n\nProperty P2 exists in design but no test file contains @zen-test: P2.\n\n**Resolution:** Add test with @zen-test: P2 marker\n\n---\n\n### 3. MINOR [CERTAIN] ORPHAN\n\n**Source:** src/workspace/utils.rs\n> @zen-impl: AC-9.9\n\n**Target:** (not found)\n\nCode declares @zen-impl: AC-9.9 but AC-9.9 does not exist in REQ-workspace.md and no component declares IMPLEMENTS: AC-9.9.\n\n**Resolution:** Remove orphan marker or add AC-9.9 to requirements\n\n---\n\n### 4. INFO [CERTAIN] SUPERSET\n\n**Source:** DESIGN-workspace.md\n\n**Target:** src/workspace/helpers.rs\n> @zen-component: WorkspaceHelpers\n\nCode declares @zen-component: WorkspaceHelpers but no such component exists in design. This may be acceptable internal helper code.\n\n---\n\n## Summary\n\n| Severity | Count |\n|----------|-------|\n| CRITICAL | 1 |\n| MAJOR | 1 |\n| MINOR | 1 |\n| INFO | 1 |\n\n**STATUS: ❌ FAILED**"
    }
  }
}
```
