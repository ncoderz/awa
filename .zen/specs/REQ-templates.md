# Template Requirements

> VERSION: 1.0.0 | STATUS: draft | UPDATED: 2025-12-11

## Introduction

This document defines requirements for the Zen CLI template system, including template source resolution (local and Git), template rendering with conditional logic, and partial composition for shared content.

## Glossary

- **Template Source**: A local directory path or Git repository containing template files
- **Partial**: A reusable template fragment stored in `_partials/` directory
- **Feature Flag**: A string identifier passed to templates for conditional rendering
- **Git Shorthand**: Abbreviated Git repository reference (e.g., `owner/repo`)
- **Ref**: A Git branch, tag, or commit hash specifier

## Stakeholders

- DEVELOPER: Engineers using templates to generate agent files
- TEMPLATE AUTHOR: Engineers creating and maintaining template sets

## Requirements

### TPL-1: Local Template Source [MUST] (proposed)

AS A developer, I WANT to use local template directories, SO THAT I can develop and test templates locally.

> Enables local template development workflow.

ACCEPTANCE CRITERIA

- AC-1.1 [event]: WHEN `--template` specifies a relative path THEN the system SHALL resolve it relative to the current directory
- AC-1.2 [event]: WHEN `--template` specifies an absolute path THEN the system SHALL use it directly
- AC-1.3 [event]: WHEN the local template path does not exist THEN the system SHALL display an error and exit
- AC-1.4 [ubiquitous]: The system SHALL NOT cache local template sources

### TPL-2: Git Repository Template Source [MUST] (proposed)

AS A developer, I WANT to use templates from Git repositories, SO THAT I can share templates across projects.

> Enables template sharing and versioning via Git.

ACCEPTANCE CRITERIA

- AC-2.1 [ubiquitous]: The system SHALL support GitHub shorthand format `owner/repo`
- AC-2.2 [ubiquitous]: The system SHALL support prefixed formats `github:owner/repo`, `gitlab:owner/repo`, `bitbucket:owner/repo`
- AC-2.3 [ubiquitous]: The system SHALL support full HTTPS URLs `https://github.com/owner/repo`
- AC-2.4 [ubiquitous]: The system SHALL support SSH URLs `git@github.com:owner/repo`
- AC-2.5 [ubiquitous]: The system SHALL support subdirectory paths `owner/repo/path/to/templates`
- AC-2.6 [ubiquitous]: The system SHALL support ref specifiers `owner/repo#branch`, `owner/repo#tag`, `owner/repo#commit`

### TPL-3: Template Caching [MUST] (proposed)

AS A developer, I WANT Git templates cached locally, SO THAT repeated runs don't require network access.

> Improves performance and enables offline usage after initial fetch.

ACCEPTANCE CRITERIA

- AC-3.1 [ubiquitous]: The system SHALL cache Git templates in `~/.cache/zen/templates/`
- AC-3.2 [conditional]: IF a cached version exists AND `--refresh` is not provided THEN the system SHALL use the cached version
- AC-3.3 [conditional]: IF `--refresh` is provided THEN the system SHALL re-fetch the Git template
- AC-3.4 [event]: WHEN fetching a Git template THEN the system SHALL perform a shallow fetch without `.git` directory

### TPL-4: Template Rendering [MUST] (proposed)

AS A template author, I WANT Eta template syntax, SO THAT I can create dynamic templates.

> Eta provides lightweight, TypeScript-native templating.

ACCEPTANCE CRITERIA

- AC-4.1 [ubiquitous]: The system SHALL render templates using Eta syntax
- AC-4.2 [ubiquitous]: The system SHALL support output tags `<%= expression %>`
- AC-4.3 [ubiquitous]: The system SHALL support control flow tags `<% code %>`
- AC-4.4 [ubiquitous]: The system SHALL support raw output tags `<%~ expression %>`

### TPL-5: Feature Flag Context [MUST] (proposed)

AS A template author, I WANT access to feature flags in templates, SO THAT I can conditionally include content.

> Enables single template to produce different output based on feature selection.

ACCEPTANCE CRITERIA

- AC-5.1 [ubiquitous]: The system SHALL provide feature flags as `it.features` array in template context
- AC-5.2 [ubiquitous]: The `it.features` array SHALL contain all feature flag strings passed via CLI or config
- AC-5.3 [state]: WHEN no features are provided THEN `it.features` SHALL be an empty array

### TPL-6: Conditional Template Logic [MUST] (proposed)

AS A template author, I WANT to check for feature flags, SO THAT I can include content conditionally.

> Standard pattern for feature-based conditional output.

ACCEPTANCE CRITERIA

- AC-6.1 [ubiquitous]: Templates SHALL support checking features via `it.features.includes('feature-name')`
- AC-6.2 [event]: WHEN a feature check evaluates to false THEN the conditional content SHALL be excluded from output

### TPL-7: Empty Output Handling [MUST] (proposed)

AS A template author, I WANT empty output to skip file creation, SO THAT optional files aren't created unnecessarily.

> Enables templates that produce no file under certain feature combinations.

ACCEPTANCE CRITERIA

- AC-7.1 [conditional]: IF rendered template output is empty or whitespace-only THEN the system SHALL NOT create the output file
- AC-7.2 [conditional]: IF rendered template contains only `<!-- ZEN:EMPTY_FILE -->` marker THEN the system SHALL create an empty file
- AC-7.3 [event]: WHEN empty output causes file skip THEN the system SHALL log that the file was skipped

### TPL-8: Partial Templates [MUST] (proposed)

AS A template author, I WANT reusable partial templates, SO THAT I can share content across multiple templates.

> Enables DRY principle in template authoring.

ACCEPTANCE CRITERIA

- AC-8.1 [ubiquitous]: The system SHALL recognize `_partials/` directory as containing partial templates
- AC-8.2 [ubiquitous]: Templates SHALL include partials via `<%~ include('_partials/name', it) %>`
- AC-8.3 [ubiquitous]: Partials SHALL receive the same context object as the including template
- AC-8.4 [ubiquitous]: Partials SHALL support the same Eta syntax as regular templates

### TPL-9: Partial Exclusion from Output [MUST] (proposed)

AS A developer, I WANT partials excluded from generated output, SO THAT only final files are created.

> Prevents helper files from polluting output directory.

ACCEPTANCE CRITERIA

- AC-9.1 [ubiquitous]: The system SHALL NOT output files from the `_partials/` directory
- AC-9.2 [ubiquitous]: The system SHALL NOT output any file or directory whose name starts with `_`

### TPL-10: Default Templates [SHOULD] (proposed)

AS A developer, I WANT bundled default templates, SO THAT I can generate standard agent files immediately.

> Provides out-of-box functionality without custom template setup.

ACCEPTANCE CRITERIA

- AC-10.1 [state]: WHEN `--template` is not provided THEN the system SHALL use bundled default templates
- AC-10.2 [ubiquitous]: Default templates SHALL generate `.github/agents/*.agent.md` files
- AC-10.3 [ubiquitous]: Default templates SHALL support common feature flags for agent configuration

### TPL-11: Template Compilation Caching [SHOULD] (proposed)

AS A developer, I WANT templates compiled once per session, SO THAT generation is fast.

> Improves performance when processing many templates.

ACCEPTANCE CRITERIA

- AC-11.1 [ubiquitous]: The system SHOULD cache compiled templates in memory during a generation session
- AC-11.2 [conditional]: IF a template is rendered multiple times THEN the system SHOULD reuse the compiled template

## Assumptions

- Template authors understand Eta template syntax
- Git repositories are publicly accessible or user has appropriate credentials
- Network access is available for initial Git template fetch

## Constraints

- Template engine limited to Eta for consistency with architecture
- Git fetching limited to degit for consistency with architecture
- No custom template syntax extensions beyond Eta

## Out of Scope

- Template validation or linting
- Template debugging tools
- Custom Eta filters or helpers
- Private Git repository authentication configuration
- Template versioning within a single repository

## Change Log

- 1.0.0 (2025-12-11): Initial requirements based on architecture
