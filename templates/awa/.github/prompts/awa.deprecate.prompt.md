<% if (it.features.includes('copilot')) { %>
---
description: Deprecate requirements by retiring IDs to the tombstone file
argument-hint: "<IDs or description of what to deprecate>"
---

<%~ include('_partials/awa.deprecate.md', it) %>
<% } %>
