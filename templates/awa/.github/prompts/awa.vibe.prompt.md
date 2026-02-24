<% if (it.features.includes('copilot')) { %>
---
description: Implement an idea from start to finish using the full awa workflow
argument-hint: "<idea> [<constraints>]"
---

<%~ include('_partials/awa.vibe.md', it) %>
<% } %>
