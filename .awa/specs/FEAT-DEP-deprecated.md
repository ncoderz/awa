# Requirement Deprecation [INFORMATIVE]

## Problem

Requirements evolve: features get removed, replaced, or consolidated. When a requirement becomes obsolete, developers need to remove it from active specs so it no longer influences implementation. However, simply deleting a requirement from a REQ file creates two problems.

First, traceability breaks: existing code markers (`@awa-impl`, `@awa-test`, `@awa-component`) referencing the removed IDs become orphans. `awa check` cannot distinguish "intentionally retired" from "stale typo." Second, the deleted ID could be silently reused in a new requirement, causing invisible confusion in the traceability chain.

There is a subtler third problem specific to AI-assisted development: LLMs process all in-context text with roughly equal weight. A deprecated requirement sitting alongside active ones — even clearly tagged as deprecated — will influence an agent's implementation. The agent may implement deleted features, follow obsolete patterns, or waste context budget on requirements that no longer matter.

## Conceptual Model

Deprecation is a tombstone mechanism. When a requirement, AC, property, or component is retired, its ID moves to a dedicated deprecation file outside the active spec files. The tombstone records only the bare IDs — no user stories, no acceptance criteria text, no design detail. This keeps LLMs uncontaminated while preserving the ID reservation.

Key abstractions:

- TOMBSTONE: A minimal record that an ID was retired. Contains only the ID itself, grouped by feature code.
- DEPRECATED FILE: A single file at `.awa/specs/deprecated/DEPRECATED.md` containing all tombstone entries across all feature codes.
- ID RESERVATION: Deprecated IDs are permanently reserved. They cannot be reused in new requirements. `awa check` enforces this.
- SILENT BY DEFAULT: References to deprecated IDs are not surfaced during normal `awa check` runs. The `--deprecated` flag enables warnings for code or spec references to deprecated IDs.

The workflow is: remove the requirement from the REQ file, remove associated design content, then add the bare IDs to DEPRECATED.md. Code markers referencing those IDs can be cleaned up at the developer's pace — `awa check --deprecated` reveals what remains.

## Scope Boundary

Deprecated ID registration, ID reservation enforcement, and optional deprecated-reference warnings during check.

## Scenarios

### Scenario 1: Retiring an Obsolete Requirement

A feature supported template caching, but the design has changed to always fetch fresh templates. The developer removes the caching requirement (GEN-5) and its ACs from REQ-GEN-generation.md, removes the corresponding design component from DESIGN-GEN-generation.md, and adds the IDs to DEPRECATED.md under a `# GEN` heading. Running `awa check` succeeds — the deprecated IDs are silently recognized.

### Scenario 2: Discovering Stale References

After deprecating GEN-5, the developer wants to find all remaining code references. They run `awa check --deprecated` and see warnings for each implementation marker still referencing the old requirement's acceptance criteria. They clean up the markers at their own pace.

### Scenario 3: Preventing ID Reuse

A new developer adds a GEN-5 requirement to REQ-GEN-generation.md, unaware the ID was previously used. `awa check` reports an error: the ID conflicts with a deprecated entry. The developer picks a new ID.

### Scenario 4: Consolidating After a Merge

After using `awa merge` to consolidate two feature codes, the old code's IDs are all deprecated. The developer adds them to DEPRECATED.md. The merged feature continues under the surviving code without traceability gaps.

## Glossary

- TOMBSTONE: A minimal deprecation record containing only retired IDs
- DEPRECATED FILE: The single file cataloging all tombstone entries
- ID RESERVATION: The guarantee that deprecated IDs are never reused
