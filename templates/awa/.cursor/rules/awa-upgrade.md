<% if (it.features.includes('cursor')) { %>
---
description: Upgrade specs to match current schemas
alwaysApply: false
---

<%~ include('_partials/awa.upgrade.md', it) %>
<% } %>
