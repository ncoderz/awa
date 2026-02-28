# Feature Context: Template Overlays [INFORMATIVE]

## Problem

Users who need to customize a shared template set must copy the entire set into
their own repository. Once copied, they own every file — including files they
never wanted to change. When the upstream template updates, there is no way to
receive those updates without manually merging the full copy.

There is also no way to maintain a "house style" layer on top of awa's bundled
templates. Teams want to say "use the standard awa template, but replace this
one partial with our own branding" — without forking the whole set.

## Conceptual Model

An overlay is a directory of template files that sits on top of a base template.
When awa builds the merged view, it starts with all base files, then applies
each overlay in order. A file in an overlay replaces the corresponding base file
by relative path. Files in the base that have no overlay counterpart pass through
unchanged. Files in an overlay that have no base counterpart are added.

The merging happens at the file level — whole-file replacement only, not
line-level patching. The template engine never sees the layering; it receives
a single flat directory containing the merged result.

Multiple overlays can be stacked. The last overlay wins over earlier overlays
when two overlays contain the same path.

Overlay sources follow the same resolution rules as the main template: local
paths and Git repositories are both accepted.

Key abstractions:

- BASE TEMPLATE: the primary template directory (local, git, or bundled)
- OVERLAY: a secondary directory whose files take precedence over the base
- MERGED VIEW: temporary directory combining base + overlays (last overlay wins)
- OVERLAY SOURCE: a local path or Git repository reference to an overlay directory

## Scenarios

### Scenario 1: Override a Single Partial

A team uses the bundled awa template but wants a custom company-specific
introduction in every generated file. They create `./overlays/company/`
containing only `_partials/header.md` with their branding. Running
`awa generate . --overlay ./overlays/company` produces output that uses
their custom header while keeping all other base template files unchanged.

### Scenario 2: Stack Multiple Overlays

A monorepo has a company-wide overlay (`./overlays/company`) and a
project-specific overlay (`./overlays/project-x`). Running
`awa generate . --overlay ./overlays/company --overlay ./overlays/project-x`
applies both in order. When both overlays contain the same file, the
project-specific version wins. Files unique to the company overlay are still
included.

### Scenario 3: Diff with Overlay

A developer runs `awa diff . --overlay ./overlays/company` to see how their
working directory compares against the merged template view. The diff correctly
reflects the overlay's replacements rather than the raw base template. This
lets them track drift even on a customized template stack.

### Scenario 4: Git Overlay Source

A shared overlay lives in a Git repository at `company/awa-overlay`. Any
developer can run `awa generate . --overlay company/awa-overlay` without
cloning it manually. The overlay is fetched and cached using the same
mechanism as Git template sources.

### Scenario 5: Config-Driven Overlay

A project's `.awa.toml` file declares `overlay = ["./overlays/base",
"./overlays/project"]`. Running `awa generate .` picks up the overlays
automatically, so no command-line flags are needed in day-to-day use.

## Glossary

- BASE TEMPLATE: The primary template directory before any overlay is applied
- OVERLAY: A directory whose files replace or supplement base template files
- MERGED VIEW: The temporary flat directory combining base and overlays
- OVERLAY SOURCE: A local path or Git repository reference for an overlay
- LAST WINS: The rule that when two overlays provide the same file, the later one takes precedence

## Change Log

- 1.0.0 (2025-01-01): Initial feature context
