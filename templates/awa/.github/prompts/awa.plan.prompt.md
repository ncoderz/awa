<% if (it.features.includes('copilot')) { %>
---
description: Create or update ad-hoc plan document(s)
argument-hint: "<plan-instructions>"
---

<%~ include('_partials/awa.plan.md', it) %>
<% } %>
