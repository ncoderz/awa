<% if (it.features.includes('copilot')) { %>
---
name: awa-check
description: Run traceability and schema checks, then fix any errors. Use this when asked to check, validate, or fix traceability and schema issues.
---

<%~ include('_partials/awa.check.md', it) %>
<% } %>

