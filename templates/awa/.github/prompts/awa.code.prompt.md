<% if (it.features.includes('copilot')) { %>
---
description: Implement code and tests based on architecture, requirements, and design (tasks optional)
argument-hint: "<task|plan|design> [<instructions>]"
---

<%~ include('_partials/awa.code.md', it) %>
<% } %>
