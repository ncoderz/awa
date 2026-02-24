<% if (it.features.includes('copilot')) { %>
---
description: Create or update requirements documents
argument-hint: "<requirements-instructions>"
---

<%~ include('_partials/awa.requirements.md', it) %>
<% } %>
