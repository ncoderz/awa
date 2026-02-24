<% if (it.features.includes('copilot')) { %>
---
description: Create or update project documentation (README.md and /docs)
argument-hint: "<documentation-instructions>"
---

<%~ include('_partials/awa.documentation.md', it) %>
<% } %>
