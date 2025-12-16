# Requirements Specification

## Introduction

This document defines requirements for the Zen CLI template system, including template source resolution (local and Git), template rendering with conditional logic, and partial composition for shared content.

## Glossary

- TEMPLATE SOURCE: A local directory path or Git repository containing template files
- PARTIAL: A reusable template fragment stored in `_partials/` directory
- FEATURE FLAG: A string identifier passed to templates for conditional rendering
- GIT SHORTHAND: Abbreviated Git repository reference (e.g., `owner/repo`)
- REF: A Git branch, tag, or commit hash specifier

## Stakeholders

- DEVELOPER: Engineers using templates to generate agent files
- TEMPLATE AUTHOR: Engineers creating and maintaining template sets

## Requirements

### TPL-1: Local Template Source [MUST]

AS A developer, I WANT to use local template directories, SO THAT I can develop and test templates locally.

> Enables local template development workflow.

ACCEPTANCE CRITERIA

- [ ] TPL-1_AC-1 [event]: WHEN `--template` specifies a relative path THEN the system SHALL resolve it relative to the current directory
- [ ] TPL-1_AC-2 [event]: WHEN `--template` specifies an absolute path THEN the system SHALL use it directly
- [ ] TPL-1_AC-3 [event]: WHEN the local template path does not exist THEN the system SHALL display an error and exit
- [ ] TPL-1_AC-4 [ubiquitous]: The system SHALL NOT cache local template sources

### TPL-2: Git Repository Template Source [MUST]

AS A developer, I WANT to use templates from Git repositories, SO THAT I can share templates across projects.

> Enables template sharing and versioning via Git.

ACCEPTANCE CRITERIA

- [ ] TPL-2_AC-1 [ubiquitous]: The system SHALL support GitHub shorthand format `owner/repo`
- [ ] TPL-2_AC-2 [ubiquitous]: The system SHALL support prefixed formats `github:owner/repo`, `gitlab:owner/repo`, `bitbucket:owner/repo`
- [ ] TPL-2_AC-3 [ubiquitous]: The system SHALL support full HTTPS URLs `https://github.com/owner/repo`
- [ ] TPL-2_AC-4 [ubiquitous]: The system SHALL support SSH URLs `git@github.com:owner/repo`
- [ ] TPL-2_AC-5 [ubiquitous]: The system SHALL support subdirectory paths `owner/repo/path/to/templates`
- [ ] TPL-2_AC-6 [ubiquitous]: The system SHALL support ref specifiers `owner/repo#branch`, `owner/repo#tag`, `owner/repo#commit`

### TPL-3: Template Caching [MUST]

AS A developer, I WANT Git templates cached locally, SO THAT repeated runs don't require network access.

> Improves performance and enables offline usage after initial fetch.

ACCEPTANCE CRITERIA

- [ ] TPL-3_AC-1 [ubiquitous]: The system SHALL cache Git templates in `~/.cache/zen/templates/`
- [ ] TPL-3_AC-2 [conditional]: IF a cached version exists AND `--refresh` is not provided THEN the system SHALL use the cached version
- [ ] TPL-3_AC-3 [conditional]: IF `--refresh` is provided THEN the system SHALL re-fetch the Git template
- [ ] TPL-3_AC-4 [event]: WHEN fetching a Git template THEN the system SHALL perform a shallow fetch without `.git` directory

### TPL-4: Template Rendering [MUST]

AS A template author, I WANT Eta template syntax, SO THAT I can create dynamic templates.

> Eta provides lightweight, TypeScript-native templating.

ACCEPTANCE CRITERIA

- [ ] TPL-4_AC-1 [ubiquitous]: The system SHALL render templates using Eta syntax
- [ ] TPL-4_AC-2 [ubiquitous]: The system SHALL support output tags `<%= expression %>`
- [ ] TPL-4_AC-3 [ubiquitous]: The system SHALL support control flow tags `<% code %>`
- [ ] TPL-4_AC-4 [ubiquitous]: The system SHALL support raw output tags `<%~ expression %>`

### TPL-5: Feature Flag Context [MUST]

AS A template author, I WANT access to feature flags in templates, SO THAT I can conditionally include content.

> Enables single template to produce different output based on feature selection.

ACCEPTANCE CRITERIA

- [ ] TPL-5_AC-1 [ubiquitous]: The system SHALL provide feature flags as `it.features` array in template context
- [ ] TPL-5_AC-2 [ubiquitous]: The `it.features` array SHALL contain all feature flag strings passed via CLI or config
- [ ] TPL-5_AC-3 [state]: WHEN no features are provided THEN `it.features` SHALL be an empty array

### TPL-6: Conditional Template Logic [MUST]

AS A template author, I WANT to check for feature flags, SO THAT I can include content conditionally.

> Standard pattern for feature-based conditional output.

ACCEPTANCE CRITERIA

- [ ] TPL-6_AC-1 [ubiquitous]: Templates SHALL support checking features via `it.features.includes('feature-name')`
- [ ] TPL-6_AC-2 [event]: WHEN a feature check evaluates to false THEN the conditional content SHALL be excluded from output

### TPL-7: Empty Output Handling [MUST]

AS A template author, I WANT empty output to skip file creation, SO THAT optional files aren't created unnecessarily.

> Enables templates that produce no file under certain feature combinations.

ACCEPTANCE CRITERIA

- [ ] TPL-7_AC-1 [conditional]: IF rendered template output is empty or whitespace-only THEN the system SHALL NOT create the output file
- [ ] TPL-7_AC-2 [conditional]: IF rendered template contains only `<!-- ZEN:EMPTY_FILE -->` marker THEN the system SHALL create an empty file
- [ ] TPL-7_AC-3 [event]: WHEN empty output causes file skip THEN the system SHALL log that the file was skipped

### TPL-8: Partial Templates [MUST]

AS A template author, I WANT reusable partial templates, SO THAT I can share content across multiple templates.

> Enables DRY principle in template authoring.

ACCEPTANCE CRITERIA

- [ ] TPL-8_AC-1 [ubiquitous]: The system SHALL recognize `_partials/` directory as containing partial templates
- [ ] TPL-8_AC-2 [ubiquitous]: Templates SHALL include partials via `<%~ include('_partials/name', it) %>`
- [ ] TPL-8_AC-3 [ubiquitous]: Partials SHALL receive the same context object as the including template
- [ ] TPL-8_AC-4 [ubiquitous]: Partials SHALL support the same Eta syntax as regular templates

### TPL-9: Partial Exclusion from Output [MUST]

AS A developer, I WANT partials excluded from generated output, SO THAT only final files are created.

> Prevents helper files from polluting output directory.

ACCEPTANCE CRITERIA

- [ ] TPL-9_AC-1 [ubiquitous]: The system SHALL NOT output files from the `_partials/` directory
- [ ] TPL-9_AC-2 [ubiquitous]: The system SHALL NOT output any file or directory whose name starts with `_`

### TPL-10: Default Templates [SHOULD]

AS A developer, I WANT bundled default templates, SO THAT I can generate standard agent files immediately.

> Provides out-of-box functionality without custom template setup.

ACCEPTANCE CRITERIA

- [ ] TPL-10_AC-1 [state]: WHEN `--template` is not provided THEN the system SHALL use bundled default templates
- [ ] TPL-10_AC-2 [ubiquitous]: Default templates SHALL generate `.github/agents/*.agent.md` files
- [ ] TPL-10_AC-3 [ubiquitous]: Default templates SHALL support common feature flags for agent configuration

### TPL-11: Template Compilation Caching [SHOULD]

AS A developer, I WANT templates compiled once per session, SO THAT generation is fast.

> Improves performance when processing many templates.

ACCEPTANCE CRITERIA

- [ ] TPL-11_AC-1 [ubiquitous]: The system SHOULD cache compiled templates in memory during a generation session
- [ ] TPL-11_AC-2 [conditional]: IF a template is rendered multiple times THEN the system SHOULD reuse the compiled template

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
