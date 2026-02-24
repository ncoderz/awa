<% if (it.features.includes('copilot')) { %>
---
description: Brainstorm ideas, explore solutions, and evaluate options
argument-hint: "<topic|problem> [<constraints>]"
---

<%~ include('_partials/awa.brainstorm.md', it) %>
<% } %>
