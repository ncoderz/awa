---
description: "Zen v0.1: Structured AI Coding"
tools: ['edit', 'search', 'runCommands', 'runTasks', 'microsoft/playwright-mcp/*', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'extensions', 'todos', 'runTests']
---

<%~ include('_partials/zen.core.md', it) %>

<tool name="read_file">
 <read path=".zen/rules/*.md" required="true" />
 <read path=".zen/specs/ARCHITECTURE.md" required="true" />
 <read path=".zen/.agent/schemas/*.schema.md" required="before writing corresponding file type" />
</tool>

