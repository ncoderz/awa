<% if (it.features.includes('copilot')) { %>
---
description: Validate alignment of source with target (check source matches target, and if not list differences)
argument-hint: "<source> [<target>]"
---

<%~ include('_partials/awa.validate-alignment.md', it) %>
<% } %>
