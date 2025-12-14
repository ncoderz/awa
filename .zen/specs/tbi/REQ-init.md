# Requirements Specification

## Introduction

This document defines requirements for the `zen init` command, which provides an interactive guided experience for selecting templates, configuring options, and initializing a project with Zen agent configuration files.

## Glossary

- TEMPLATE REGISTRY: A collection of available template sources (bundled, remote, or custom)
- TEMPLATE PREVIEW: A summary view of template contents before applying
- INITIALIZATION WIZARD: The interactive prompt-based setup flow

## Stakeholders

- DEVELOPER: Engineers setting up Zen agents in a new or existing project
- TEMPLATE AUTHOR: Engineers publishing templates for discovery

## Requirements

### INIT-1: Init Command Entry Point [MUST]

AS A developer, I WANT an init command, SO THAT I can set up Zen templates interactively without memorizing CLI options.

> Provides a guided setup experience for new users.

ACCEPTANCE CRITERIA

- [ ] AC-1.1 [event]: WHEN the user invokes `zen init` THEN the system SHALL start the interactive initialization wizard
- [ ] AC-1.2 [event]: WHEN the user invokes `zen init --help` THEN the system SHALL display init command usage
- [ ] AC-1.3 [ubiquitous]: The system SHALL display a welcome message upon starting the wizard

DEPENDS ON: CLI-1

### INIT-2: Template Source Selection [MUST]

AS A developer, I WANT to choose a template source interactively, SO THAT I can browse available options.

> Enables discovery of available templates without prior knowledge.

ACCEPTANCE CRITERIA

- [ ] AC-2.1 [event]: WHEN the wizard starts THEN the system SHALL prompt the user to select a template source type
- [ ] AC-2.2 [ubiquitous]: The system SHALL offer options: "Bundled templates", "Git repository", "Local directory"
- [ ] AC-2.3 [conditional]: IF user selects "Bundled templates" THEN the system SHALL display a list of available bundled template sets
- [ ] AC-2.4 [conditional]: IF user selects "Git repository" THEN the system SHALL prompt for a repository URL or shorthand
- [ ] AC-2.5 [conditional]: IF user selects "Local directory" THEN the system SHALL prompt for a local path

### INIT-3: Bundled Template Discovery [MUST]

AS A developer, I WANT to see bundled templates with descriptions, SO THAT I can choose the right one for my project.

> Bundled templates provide vetted, ready-to-use options.

ACCEPTANCE CRITERIA

- [ ] AC-3.1 [ubiquitous]: The system SHALL maintain a list of bundled templates with names and descriptions
- [ ] AC-3.2 [event]: WHEN displaying bundled templates THEN the system SHALL show the template name and a brief description
- [ ] AC-3.3 [event]: WHEN the user selects a bundled template THEN the system SHALL resolve it for use in generation

### INIT-4: Template Preview [SHOULD]

AS A developer, I WANT to preview template contents before applying, SO THAT I can verify it meets my needs.

> Reduces trial-and-error by showing what will be generated.

ACCEPTANCE CRITERIA

- [ ] AC-4.1 [event]: WHEN a template is selected THEN the system SHALL offer a "Preview" option before proceeding
- [ ] AC-4.2 [conditional]: IF the user chooses to preview THEN the system SHALL display the list of files that would be generated
- [ ] AC-4.3 [conditional]: IF the user chooses to preview THEN the system SHALL display template metadata (name, description, author if available)
- [ ] AC-4.4 [event]: WHEN preview is complete THEN the system SHALL prompt to proceed or select a different template

### INIT-5: Feature Flag Selection [MUST]

AS A developer, I WANT to select feature flags interactively, SO THAT I can customize the generated output.

> Templates may declare available features for user selection.

ACCEPTANCE CRITERIA

- [ ] AC-5.1 [event]: WHEN a template is selected THEN the system SHALL check for available feature flags
- [ ] AC-5.2 [conditional]: IF the template contains a `_README.md` file with a section titled "Features" THEN the system SHALL parse feature flags from bullet-list items whose first token is a backticked flag name
- [ ] AC-5.3 [conditional]: IF the template has no declared features THEN the system SHALL skip the feature selection step
- [ ] AC-5.4 [event]: WHEN the user confirms feature selection THEN the system SHALL store the selected features for generation

### INIT-6: Output Directory Configuration [MUST]

AS A developer, I WANT to specify the output directory, SO THAT files are generated in the correct location.

> Defaults to common convention but allows customization.

ACCEPTANCE CRITERIA

- [ ] AC-6.1 [event]: WHEN feature selection is complete THEN the system SHALL prompt for output directory
- [ ] AC-6.2 [ubiquitous]: The system SHALL suggest the current working directory as the default output directory
- [ ] AC-6.3 [event]: WHEN the user provides a custom path THEN the system SHALL validate it is a writable location
- [ ] AC-6.4 [conditional]: IF the output directory does not exist THEN the system SHALL offer to create it

### INIT-7: Configuration File Generation [SHOULD]

AS A developer, I WANT the wizard to create a `.zen.toml` file, SO THAT future runs use the same configuration.

> Persists wizard choices for reproducibility.

ACCEPTANCE CRITERIA

- [ ] AC-7.1 [event]: WHEN configuration is complete THEN the system SHALL offer to save settings to `.zen.toml`
- [ ] AC-7.2 [conditional]: IF user accepts THEN the system SHALL create `.zen.toml` with `template`, `output`, and `features` settings
- [ ] AC-7.3 [conditional]: IF `.zen.toml` already exists THEN the system SHALL prompt to overwrite or merge
- [ ] AC-7.4 [event]: WHEN merging THEN the system SHALL preserve existing settings not covered by wizard choices, including unknown keys

### INIT-8: Generation Execution [MUST]

AS A developer, I WANT the wizard to execute generation after configuration, SO THAT I get the output immediately.

> Completes the workflow in a single command.

ACCEPTANCE CRITERIA

- [ ] AC-8.1 [event]: WHEN all configuration is complete THEN the system SHALL display a summary of choices
- [ ] AC-8.2 [event]: WHEN the user confirms THEN the system SHALL invoke the generate workflow with collected options
- [ ] AC-8.3 [event]: WHEN generation completes THEN the system SHALL display a success message with next steps
- [ ] AC-8.4 [conditional]: IF the user cancels at any prompt THEN the system SHALL exit with a non-zero exit code without generating files

### INIT-9: Non-Interactive Fallback [SHOULD]

AS A developer, I WANT init to work in CI environments, SO THAT I can script initial setup.

> Enables automation while preserving interactive defaults.

ACCEPTANCE CRITERIA

- [ ] AC-9.1 [ubiquitous]: The system SHALL accept `--template`, `--features` options and a positional output directory argument to bypass prompts
- [ ] AC-9.2 [conditional]: IF all required options are provided via CLI THEN the system SHALL skip interactive prompts
- [ ] AC-9.3 [conditional]: IF running in a non-interactive terminal AND `--template` is not provided THEN the system SHALL display an error and exit with a non-zero exit code
- [ ] AC-9.4 [conditional]: IF running in a non-interactive terminal AND `--template` is provided THEN the system SHALL execute initialization without interactive prompts using provided options and defaults

DEPENDS ON: CLI-2, CLI-3, CLI-4

### INIT-10: Keyboard Navigation [MUST]

AS A developer, I WANT keyboard shortcuts in the wizard, SO THAT I can navigate efficiently.

> Standard UX for interactive CLI tools.

ACCEPTANCE CRITERIA

- [ ] AC-10.1 [ubiquitous]: The system SHALL support arrow keys for navigating selection lists
- [ ] AC-10.2 [ubiquitous]: The system SHALL support Enter to confirm selection
- [ ] AC-10.3 [ubiquitous]: The system SHALL support Ctrl+C to cancel at any point
- [ ] AC-10.4 [ubiquitous]: The system SHALL support Escape to cancel the current prompt

## Assumptions

- Bundled templates are packaged with the CLI distribution
- Template metadata (features, description) can be read from `_README.md` in template root
- The @clack/prompts library provides the interactive prompt primitives

## Constraints

- The wizard MUST complete within a reasonable number of decision prompts (maximum 6), excluding free-form input prompts (e.g., paths/URLs) and optional preview display
- Network access is only required for Git repository templates

## Out of Scope

- Template publishing or upload functionality
- User accounts or authentication
- Template ratings or reviews

## Change Log

- 1.0.0 (2025-12-11): Initial requirements based on architecture
