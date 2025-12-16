<schema target-files=".zen/specs/REQ-{code}-{feature-name}.md">

```json
{
  "description": "Requirements only. Succinct language. Do not overspecify. Omit irrelevant information.",
  "required": ["introduction", "requirements"],
  "properties": {
    "metadata": { "properties": { "changeLog": { "type": "array", "items": { "properties": { "version": {}, "date": {}, "changes": {} } } } } },
    "introduction": { "type": "brief context for the requirements" },
    "stakeholders": { "type": "array", "items": { "properties": { "role": {}, "description": {} } } },
    "glossary": { "type": "object of term→definition" },
    "requirements": { "type": "array", "items": { "$ref": "#/$defs/requirement" } },
    "assumptions": { "type": "array of strings" },
    "constraints": { "type": "array of strings" },
    "outOfScope": { "type": "array of strings" }
  },
  "$defs": {
    "requirement": {
      "required": ["id", "title", "story", "criteria"],
      "properties": {
        "id": { "type": "pattern: REQ-{code}-{n} or REQ-{code}-{n}_{m} for subrequirements (e.g., REQ-cli-3, REQ-eng-1_1)" },
        "title": { "type": "short title" },
        "story": { "required": ["role", "want", "benefit"], "properties": { "role": {}, "want": {}, "benefit": {} } },
        "criteria": { "type": "array", "items": { "$ref": "#/$defs/criterion" } },
        "priority": { "enum": ["must", "should", "could", "wont"] },
        "rationale": { "type": "why this requirement exists" },
        "dependencies": { "type": "array of requirement IDs" },
        "subrequirements": { "type": "array", "items": { "$ref": "#/$defs/requirement" } }
      }
    },
    "criterion": {
      "required": ["id", "type", "statement"],
      "properties": {
        "id": { "type": "pattern: AC-{code}-{n}.{m} or AC-{code}-{n}_{m}.{p} for subrequirements (e.g., AC-cli-3.1, AC-eng-1_1.2)" },
        "type": { "enum": ["ubiquitous", "event", "state", "conditional", "optional", "complex"] },
        "statement": { "type": "testable statement using SHALL/SHOULD/MAY" },
        "notes": { "type": "additional context" },
        "testable": { "type": "boolean, default true" },
        "verified": { "type": "boolean; true when validated as implemented and tested" }
      }
    }
  },
  "$render": {
    "template": "# Requirements Specification\n\n## Introduction\n{introduction}\n\n## Glossary\n{glossary→'- {TERM}: {definition}'}\n\n## Stakeholders\n{stakeholders→'- {ROLE}: {description}'}\n\n## Requirements\n{requirements→'### {id}: {title} [{PRIORITY?}]\n\nAS A {story.role}, I WANT {story.want}, SO THAT {story.benefit}.\n\n> {rationale?}\n\nACCEPTANCE CRITERIA\n\n{criteria→\"- [{verified?x: }] {id} [{type}]: {statement} — {notes?} [untestable?]\"}\n\nDEPENDS ON: {dependencies?}'}\n\n## Assumptions\n{assumptions→'- {}'}\n\n## Constraints\n{constraints→'- {}'}\n\n## Out of Scope\n{outOfScope→'- {}'}\n\n## Change Log\n{metadata.changeLog→'- {version} ({date}): {changes}'}",
    "omit": ["section if empty", "[PRIORITY] if absent", "rationale blockquote if absent", "— {notes} if absent", "[untestable] if testable true/absent", "DEPENDS ON if empty"],
    "checkbox": "[x] if verified true, [ ] otherwise",
    "prohibited": ["**bold** — use CAPITALS", "FieldName: value patterns", "nested bullets for story/criterion", "showing 'testable: true'", "headers for individual criteria"]
  }
}
```

<example>
# Requirements Specification

## Introduction

Core engine requirements for game framework.

## Glossary

- GAME LOOP: Core cycle of update-render that drives the engine
- CONTEXT: Runtime state container for engine subsystems

## Stakeholders

- GAME DEVELOPER: Builds games using the engine API
- ENGINE MAINTAINER: Maintains and extends engine internals

## Requirements

### REQ-eng-1: Core Engine Framework [MUST]

AS A game developer, I WANT a game loop, SO THAT predictable execution.

> Foundation for all games.

ACCEPTANCE CRITERIA

- [x] AC-eng-1.1 [event]: WHEN engine initializes THEN system SHALL create context
- [ ] AC-eng-1.2 [event]: WHEN `--verbose` flag is provided THEN system SHALL enable debug logging — CLI flag
- [ ] AC-eng-1.3 [ubiquitous]: The system SHALL maintain 60fps minimum frame rate
- [ ] AC-eng-1.4 [event]: WHEN multiple `--preset` options are provided THEN system SHALL collect all values
- [ ] AC-eng-1.5 [conditional]: IF config contains a `[presets]` table THEN system SHALL parse it as a dictionary

### REQ-eng-1_1: Subsystem Registration [SHOULD]

AS A engine maintainer, I WANT subsystems to self-register, SO THAT modular architecture.

ACCEPTANCE CRITERIA

- [ ] AC-eng-1_1.1 [event]: WHEN subsystem loads THEN it SHALL register with context

### REQ-eng-2: Resource Management [MUST]

AS A game developer, I WANT automatic resource loading, SO THAT simplified asset management.

ACCEPTANCE CRITERIA

- [ ] AC-eng-2.1 [event]: WHEN resource requested THEN system SHALL load asynchronously
- [ ] AC-eng-2.2 [ubiquitous]: The system SHALL cache loaded resources

DEPENDS ON: REQ-eng-1

## Assumptions

- Target platform supports OpenGL 3.3 or higher
- Config file uses TOML format with `[section]` syntax

## Constraints

- Must run on Windows, macOS, and Linux
- CLI options like `--features` and `--remove-features` follow POSIX conventions

## Out of Scope

- Mobile platform support
- Console platform support

## Change Log

- 1.0.0 (2025-01-10): Initial requirements
- 1.1.0 (2025-01-15): Added `--preset` CLI option
</example>

</schema>