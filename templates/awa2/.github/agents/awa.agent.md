<% if (it.features.includes('copilot')) { %>
---
description: "awa <%= it.version %>"
tools: ['edit', 'search', 'runCommands', 'runTasks', 'microsoft/playwright-mcp/*', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'extensions', 'todos', 'runTests']
---

<%~ include('_partials/awa-core.md', it) %>
<% } %>
