<% if (it.features.includes('cursor')) { %>
---
description: Run traceability and schema checks, then fix any errors
alwaysApply: false
---

<%~ include('_partials/awa.check.md', it) %>
<% } %>

