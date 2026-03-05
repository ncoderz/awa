<% if (it.features.includes('copilot')) { %>
---
description: Create or update task list document
argument-hint: "<CODE> [<instructions>]"
---

<%~ include('_partials/awa-tasks.md', it) %>
<% } %>
