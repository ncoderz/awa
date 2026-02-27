<% if (it.features.includes('cursor')) { %>
---
description: awa AI coding assistant — core system instructions
alwaysApply: true
---

<%~ include('_partials/awa.core.md', it) %>

<tool name="read_file">
 <read path=".awa/rules/*.md" required="true" />
 <read path=".awa/specs/ARCHITECTURE.md" required="true" />
 <read path=".awa/.agent/schemas/*.rules.yaml" required="before writing corresponding file type" />
</tool>
<% } %>
