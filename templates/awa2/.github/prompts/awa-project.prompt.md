<% if (it.features.includes('copilot')) { %>
---
description: Create or update PROJECT.md
argument-hint: "<project-instructions>"
---

<%~ include('_partials/awa-project.md', it) %>
<% } %>
