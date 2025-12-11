### File Access Permissions

| File Type     | Read | Write |
|---------------|------|-------|
| architecture  | <%= it.permissions.architecture?.read ? '✅' : '❌' %>   | <%= it.permissions.architecture?.write ? '✅' : '❌' %>    |
| requirements  | <%= it.permissions.requirements?.read ? '✅' : '❌' %>   | <%= it.permissions.requirements?.write ? '✅' : '❌' %>    |
| design        | <%= it.permissions.design?.read ? '✅' : '❌' %>   | <%= it.permissions.design?.write ? '✅' : '❌' %>    |
| api           | <%= it.permissions.api?.read ? '✅' : '❌' %>   | <%= it.permissions.api?.write ? '✅' : '❌' %>    |
| plan          | <%= it.permissions.plan?.read ? '✅' : '❌' %>   | <%= it.permissions.plan?.write ? '✅' : '❌' %>    |
| project       | <%= it.permissions.project?.read ? '✅' : '❌' %>   | <%= it.permissions.project?.write ? '✅' : '❌' %>    |
| code          | <%= it.permissions.code?.read ? '✅' : '❌' %>   | <%= it.permissions.code?.write ? '✅' : '❌' %>    |
| tests         | <%= it.permissions.tests?.read ? '✅' : '❌' %>   | <%= it.permissions.tests?.write ? '✅' : '❌' %>    |
| documentation | <%= it.permissions.documentation?.read ? '✅' : '❌' %>   | <%= it.permissions.documentation?.write ? '✅' : '❌' %>    |

**Legend:**
- ✅ = Allowed
<% if (it.hasWriteRestrictions !== false) { %>
- ❌ = Not allowed
<% } %>
