---
title: Skills
description: awa skills and how to invoke them — from brainstorming through implementation and beyond.
---

awa provides skills that guide AI agents through specific workflow tasks. Agents may pick up the right skill from context, but for reliable results we recommend invoking them explicitly with a slash command.

## Invoking Skills

Use the `/awa.<skill>` slash command to invoke a skill by name. This works in GitHub Copilot, Claude, Cursor, Gemini, and any other agent that supports awa prompt files:

```
/awa.code implement the tasks in TASK-DIFF-diff-001.md
/awa.design create a design for authentication
/awa.brainstorm how to handle rate limiting
/awa.requirements write requirements for bulk export
```

:::tip
You can also describe what you want in plain language and the agent will usually activate the correct skill from context — but the slash command is more predictable.
:::

## Workflow Skills

These follow the awa pipeline: Architecture → Features → Requirements → Design → Tasks → Code → Documentation.

### awa-architecture

Create or update `ARCHITECTURE.md` — the system overview, components, and constraints.

```
/awa.architecture Update for the changes we just discussed.
/awa.architecture Add a caching layer.
```

### awa-feature

Create or update feature context documents (`FEAT-*.md`) — problem statement, motivation, scenarios. Non-normative; sets the stage for requirements.

```
/awa.feature Describe bulk export — motivation and scenarios.
/awa.feature Create a FEAT doc for the new authentication flow.
```

### awa-requirements

Create or update requirements (`REQ-*.md`) in EARS format (INCOSE). Each requirement gets an ID and testable acceptance criteria.

```
/awa.requirements Write requirements for bulk export with retry support.
/awa.requirements Create REQ and acceptance criteria for rate limiting.
```

### awa-design

Create or update design documents (`DESIGN-*.md`) — components, interfaces, correctness properties. Links back to requirements via IMPLEMENTS/VALIDATES.

```
/awa.design Design the implementation for authentication.
/awa.design Create a design doc covering DIFF-7 through DIFF-10.
```

### awa-tasks

Break requirements and designs into step-by-step implementation tasks (`TASK-*.md`). Each task references specific acceptance criteria.

```
/awa.tasks Create tasks for the authentication design.
/awa.tasks Break DESIGN-DIFF into implementation work items.
```

### awa-code

Implement code and tests with full traceability markers (`@awa-component`, `@awa-impl`, `@awa-test`). Works from tasks, designs, or requirements.

```
/awa.code Implement the tasks in task 006.
/awa.code Write code for the rate limiter design.
/awa.code Implement DIFF-7 acceptance criteria.
```

### awa-documentation

Create or update user-facing documentation (`README.md`, `docs/`). Derives content from specs — summarizes rather than duplicates.

```
/awa.documentation Update README and docs to match current CLI options.
/awa.documentation Write docs for the new template testing feature.
```

### awa-examples

Create concrete usage examples (`EXAMPLE-*.md`) — code samples, CLI demonstrations, configuration snippets for a feature.

```
/awa.examples Create usage examples for the overlay feature.
/awa.examples Show CLI examples for multi-target configuration.
```

## Utility Skills

### awa-brainstorm

Explore ideas, generate options, and evaluate trade-offs. Diverges first (many ideas), then converges (recommended approach).

```
/awa.brainstorm How to add a PKI flow for the bobcat server.
/awa.brainstorm Options for handling concurrent template generation.
/awa.brainstorm Trade-offs between polling and webhooks?
```

### awa-plan

Create ad-hoc plans (`PLAN-*.md`) for work that doesn't need full requirements and design. Good for quick iterations.

```
/awa.plan Create a plan to add a --delete flag to the CLI.
/awa.plan Plan out the migration from Biome to ESLint.
```

### awa-check

Run [`awa check`](/reference/cli/#awa-check), analyze the output, fix all errors, and re-run until clean. Handles orphaned markers, broken cross-refs, schema violations, and uncovered acceptance criteria.

```
/awa.check Check traceability and fix any errors.
/awa.check Run awa check and resolve all findings.
```

### awa-align

Validate that one artifact aligns with another — e.g. design covers all requirements, or code matches the design. Produces an alignment report (`ALIGN-*.md`).

```
/awa.align Align DESIGN-DIFF with REQ-DIFF.
/awa.align Check whether code fully covers DIFF-7 acceptance criteria.
```

### awa-refactor

Refactor code while preserving all traceability markers and behavior. Runs [`awa check`](/reference/cli/#awa-check) afterward to verify nothing broke.

```
/awa.refactor Refactor src/core/template-resolver.ts for readability.
/awa.refactor Extract the validation logic into a separate module.
```

### awa-vibe

Take an idea from concept to working implementation in one pass, flowing through the full workflow. Pauses at each stage transition for confirmation (unless you request autonomous mode).

```
/awa.vibe Template caching with TTL support.
/awa.vibe Implement rate limiting from scratch.
```

### awa-upgrade

Upgrade existing spec files to match current schema definitions. Useful after schema changes to bring old specs into compliance.

```
/awa.upgrade Upgrade the specs to match current schemas.
/awa.upgrade Migrate all REQ files to the new schema format.
```

### awa-usage

Answer questions about awa itself — how to use it, configure it, or understand its concepts.

```
/awa.usage How do I set up awa check in CI?
/awa.usage Explain how traceability markers work.
/awa.usage What does the --overlay flag do?
```

## Spec Management Skills

### awa-spec-tidy

Reorganize specifications logically — reorder sections, fix numbering, clean up structure without changing meaning.

```
/awa.spec-tidy Tidy the specs — they've got messy and out of hand!
/awa.spec-tidy Reorganize the requirements by topic.
```

### awa-spec-merge

Merge two feature codes into one — combines spec files, recodes traceability IDs, and cleans up. Uses [`awa spec merge`](/reference/cli/#awa-spec-merge-source-target) under the hood.

```
/awa.spec-merge Merge the CHK feature code into CLI.
/awa.spec-merge Combine SRC and TGT feature codes.
```

### awa-spec-deprecate

Retire requirement IDs by moving them to the tombstone file (`DEPRECATED.md`). Removes traceability markers from code and cleans up spec references.

```
/awa.spec-deprecate Deprecate DIFF-3 and DIFF-4 — they're no longer needed.
/awa.spec-deprecate Retire the old authentication requirements.
```
