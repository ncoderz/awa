<% if (it.features.includes('copilot')) { %>
---
description: Run traceability and schema checks, then fix any errors
argument-hint: "[<instructions>]"
---

<%~ include('_partials/awa.check.md', it) %>
<% } %>

