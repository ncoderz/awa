<% if (it.features.includes('copilot')) { %>
---
name: awa-deprecate
description: Deprecate requirements by retiring IDs to the tombstone file. Use this when asked to deprecate, retire, or remove requirements, acceptance criteria, or components.
---

<%~ include('_partials/awa.deprecate.md', it) %>
<% } %>
