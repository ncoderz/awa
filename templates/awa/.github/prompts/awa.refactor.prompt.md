<% if (it.features.includes('copilot')) { %>
---
description: Refactor code or docs while preserving behavior, meaning, and traceability
argument-hint: "<target> [<refactor-goal>]"
---

<%~ include('_partials/awa.refactor.md', it) %>
<% } %>
