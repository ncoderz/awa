<% if (it.features.includes('copilot')) { %>
---
description: Merge two feature codes into one using awa spec merge
argument-hint: "<source-code> <target-code>"
---

<%~ include('_partials/awa.spec-code-merge.md', it) %>
<% } %>
