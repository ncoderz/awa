<% if (it.features.includes('qwen')) { %>
<%~ include('_partials/awa.core.md', it) %>

<tool name="read_file">
 <read path=".awa/rules/*.md" required="true" />
 <read path=".awa/specs/ARCHITECTURE.md" required="true" />
 <read path=".awa/.agent/schemas/*.schema.yaml" required="before writing corresponding file type" />
</tool>
<% } %>
