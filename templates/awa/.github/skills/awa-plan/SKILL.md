<% if (it.features.includes('copilot')) { %>
---
name: awa-plan
description: Create or update ad-hoc plan documents. Use this when asked to create plans, break down work, or organize tasks, but not when specifically asked to create tasks from requirements and design documents.
---

<%~ include('_partials/awa.plan.md', it) %>
<% } %>
