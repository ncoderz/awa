<% if (it.features.includes('copilot')) { %>
---
description: Create or update task list document
argument-hint: "<design> [<instructions>]"
---

<%~ include('_partials/awa.tasks.md', it) %>
<% } %>
