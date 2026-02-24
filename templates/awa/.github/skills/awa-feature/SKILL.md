<% if (it.features.includes('copilot')) { %>
---
name: awa-feature
description: Create or update feature context documents. Use this when asked to describe a feature, explain motivation, or provide non-normative context.
---

<%~ include('_partials/awa.feature.md', it) %>
<% } %>
