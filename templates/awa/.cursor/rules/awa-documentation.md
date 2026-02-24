<% if (it.features.includes('cursor')) { %>
---
description: Create or update project documentation (README.md and /docs)
alwaysApply: false
---

<%~ include('_partials/awa.documentation.md', it) %>
<% } %>
