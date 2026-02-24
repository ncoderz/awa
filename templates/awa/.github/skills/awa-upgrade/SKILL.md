<% if (it.features.includes('copilot')) { %>
---
name: awa-upgrade
description: Upgrade specs to match current schemas. Use this when asked to upgrade, migrate, or update specification documents to conform to schema changes.
---

<%~ include('_partials/awa.upgrade.md', it) %>
<% } %>
