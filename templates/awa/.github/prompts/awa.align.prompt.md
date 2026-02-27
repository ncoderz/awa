<% if (it.features.includes('copilot')) { %>
---
description: Align of source with target (check source matches target, and if not list differences)
argument-hint: "<source> [<target>]"
---

<%~ include('_partials/awa.align.md', it) %>
<% } %>
