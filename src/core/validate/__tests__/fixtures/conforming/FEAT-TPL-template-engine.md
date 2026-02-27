# Template Engine Feature Context [INFORMATIVE]

## Problem

Developers need to generate AI agent configuration files across multiple projects consistently. Manual creation is error-prone, time-consuming, and leads to drift between projects. There is no standard way to conditionally include or exclude configuration sections based on project needs.

## Conceptual Model

The template engine treats configuration files as templates that can be rendered with a set of feature flags. Users think of features as toggles — enable "copilot" to get GitHub Copilot config, enable "claude" for Claude config, etc. The engine resolves which template files to include, renders them with the active feature set, and writes the output.

Key abstractions:
- TEMPLATE: A file with optional Eta expressions
- FEATURE FLAG: A named toggle that controls conditional rendering
- PARTIAL: A reusable template fragment included by other templates
- PRESET: A named bundle of feature flags

## Scenarios

### Scenario 1: First-time Setup

A developer starts a new project and wants to add AI agent configuration for GitHub Copilot and Claude. They run `awa generate --features copilot,claude` and get a complete set of configuration files tailored to those two agents.

### Scenario 2: Adding a New Agent

An existing project already has Copilot configuration. The developer adds Cursor support by running `awa generate --features copilot,cursor`. The engine merges the new feature without disrupting existing configuration.

### Scenario 3: Previewing Changes

Before applying changes, the developer runs `awa diff` to see what files would be added, modified, or removed. This gives confidence before committing.

## Background

Prior art includes tools like cookiecutter (Python), degit (JS), and Yeoman. These focus on one-time scaffolding. awa differs by supporting re-generation — you can run it again to update configuration as templates evolve.

## Glossary

- ETA: The template rendering library used by awa
- FEATURE FLAG: A string identifier that enables conditional template content
- PARTIAL: A template file prefixed with `_` that can be included by other templates

## Change Log

- 1.0.0 (2025-01-10): Initial feature context
