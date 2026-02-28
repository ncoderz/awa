<% if (it.features.includes('copilot')) { %>
---
name: awa-usage
description: Understand awa, its CLI, and configuration. Use this when asked about awa itself, how to use it, or how to configure it.
---

<%~ include('_partials/awa.usage.md', it) %>
<% } %>
