<% if (it.features.includes('copilot')) { %>
---
description: Create or update ARCHITECTURE.md
argument-hint: "<architecture-instructions>"
---

<%~ include('_partials/awa.architecture.md', it) %>
<% } %>
