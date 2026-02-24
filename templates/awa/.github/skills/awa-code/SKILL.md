<% if (it.features.includes('copilot')) { %>
---
name: awa-code
description: Implement code and tests based on architecture, requirements, and design (or a set of tasks). Use this when asked to implement features, write code, or create tests.
---

<%~ include('_partials/awa.code.md', it) %>
<% } %>
