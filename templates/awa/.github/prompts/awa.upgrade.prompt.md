<% if (it.features.includes('copilot')) { %>
---
description: Upgrade specs to match current schemas
argument-hint: "[<upgrade-instructions>]"
---

<%~ include('_partials/awa.upgrade.md', it) %>
<% } %>
