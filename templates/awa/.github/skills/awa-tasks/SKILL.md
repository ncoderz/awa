<% if (it.features.includes('copilot')) { %>
---
name: awa-tasks
description: Create or update task list documents. Use this when asked to create tasks, generate implementation steps, or break down requirements and designs into work items.
---

<%~ include('_partials/awa.tasks.md', it) %>
<% } %>
