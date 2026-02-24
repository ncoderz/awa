<% if (it.features.includes('copilot')) { %>
---
description: Create or update feature context documents
argument-hint: "<feature-instructions>"
---

<%~ include('_partials/awa.feature.md', it) %>
<% } %>
