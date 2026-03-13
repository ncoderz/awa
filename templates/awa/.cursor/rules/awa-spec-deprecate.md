<% if (it.features.includes('cursor')) { %>
---
description: Deprecate requirements by retiring IDs to the tombstone file
alwaysApply: false
---

<%~ include('_partials/awa.spec-deprecate.md', it) %>
<% } %>
