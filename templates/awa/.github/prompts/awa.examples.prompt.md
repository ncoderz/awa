<% if (it.features.includes('copilot')) { %>
---
description: Create or update usage examples for a feature
argument-hint: "<examples-instructions>"
---

<%~ include('_partials/awa.examples.md', it) %>
<% } %>
