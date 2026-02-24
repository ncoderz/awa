<% if (it.features.includes('kilocode')) { %>
---
description: awa AI coding assistant — core system instructions
---

<%~ include('_partials/awa.core.md', it) %>

<tool name="read_file">
 <read path=".awa/rules/*.md" required="true" />
 <read path=".awa/specs/ARCHITECTURE.md" required="true" />
 <read path=".awa/.agent/schemas/*.schema.md" required="before writing corresponding file type" />
</tool>
<% } %>
