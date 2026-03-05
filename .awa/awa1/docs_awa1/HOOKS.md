# AI Coding Tool Hooks — Reference

Research date: March 2026

This document catalogues the hook entry points (lifecycle events) supported by Claude Code and VS Code / GitHub Copilot, based on their official documentation. It serves as a reference for designing awa's normalized hook abstraction.

---

## Claude Code Hook Events (18 events)

Source: <https://code.claude.com/docs/en/hooks>

### Event Summary

| Event              | When it fires                                      | Blockable?                            | Matcher field                                                                                          |
| ------------------ | -------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| SessionStart       | Session begins or resumes                          | No                                    | `startup`, `resume`, `clear`, `compact`                                                                |
| UserPromptSubmit   | User submits a prompt, before Claude processes it  | Yes                                   | No matcher (always fires)                                                                              |
| PreToolUse         | Before a tool call executes                        | Yes (allow/deny/ask)                  | Tool name: `Bash`, `Edit`, `Write`, `Read`, `Glob`, `Grep`, `Agent`, `WebFetch`, `WebSearch`, `mcp__*` |
| PermissionRequest  | When a permission dialog appears                   | Yes (allow/deny)                      | Tool name (same as PreToolUse)                                                                         |
| PostToolUse        | After a tool call succeeds                         | No (advisory — can feed context back) | Tool name                                                                                              |
| PostToolUseFailure | After a tool call fails                            | No (advisory)                         | Tool name                                                                                              |
| Notification       | When Claude Code sends a notification              | No                                    | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`                               |
| SubagentStart      | When a subagent is spawned                         | No (context injection only)           | Agent type: `Bash`, `Explore`, `Plan`, custom names                                                    |
| SubagentStop       | When a subagent finishes                           | Yes (force continue)                  | Agent type                                                                                             |
| Stop               | When Claude finishes responding                    | Yes (force continue)                  | No matcher                                                                                             |
| TeammateIdle       | When a team teammate is about to go idle           | Yes (exit 2 only)                     | No matcher                                                                                             |
| TaskCompleted      | When a task is being marked as completed           | Yes (exit 2 only)                     | No matcher                                                                                             |
| ConfigChange       | When a configuration file changes during a session | Yes                                   | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills`                     |
| WorktreeCreate     | When a worktree is being created                   | Yes (replaces default git behavior)   | No matcher                                                                                             |
| WorktreeRemove     | When a worktree is being removed                   | No                                    | No matcher                                                                                             |
| PreCompact         | Before context compaction                          | No                                    | `manual`, `auto`                                                                                       |
| SessionEnd         | When a session terminates                          | No                                    | `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`                         |

### Hook Handler Types

Claude Code supports four handler types:

| Type      | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| `command` | Runs a shell command. Receives JSON on stdin, returns results via exit codes and stdout.                           |
| `http`    | Sends JSON as HTTP POST to a URL. Response body uses the same JSON output format.                                  |
| `prompt`  | Sends a prompt to a Claude model for single-turn LLM evaluation. Returns `{ "ok": true/false, "reason": "..." }`.  |
| `agent`   | Spawns a subagent with tool access (Read, Grep, Glob) for multi-turn verification. Same response schema as prompt. |

Not all events support all types:

- **All four types**: PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Stop, SubagentStop, TaskCompleted, UserPromptSubmit
- **Command only**: ConfigChange, Notification, PreCompact, SessionEnd, SessionStart, SubagentStart, TeammateIdle, WorktreeCreate, WorktreeRemove

### Configuration Locations

| Location                      | Scope                         | Committed?               |
| ----------------------------- | ----------------------------- | ------------------------ |
| `~/.claude/settings.json`     | All projects (user)           | No, local to machine     |
| `.claude/settings.json`       | Single project                | Yes                      |
| `.claude/settings.local.json` | Single project                | No, gitignored           |
| Managed policy settings       | Organization-wide             | Yes, admin-controlled    |
| Plugin `hooks/hooks.json`     | When plugin is enabled        | Yes, bundled with plugin |
| Skill or agent frontmatter    | While the component is active | Yes, defined in file     |

### Configuration Format

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/validate-bash.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/post-edit.sh"
          }
        ]
      }
    ]
  }
}
```

### Common Input Fields (all events, via stdin)

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse"
}
```

Plus event-specific fields (e.g., `tool_name`, `tool_input`, `tool_response`, `prompt`, `source`, etc.)

### Exit Code Semantics

| Exit Code | Meaning                                                                  |
| --------- | ------------------------------------------------------------------------ |
| 0         | Success — stdout parsed as JSON                                          |
| 2         | Blocking error — action prevented, stderr fed to Claude                  |
| Other     | Non-blocking warning — stderr shown in verbose mode, execution continues |

### Decision Control Patterns

Different events use different decision mechanisms:

| Pattern                       | Events                                                                              | Fields                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Top-level `decision`          | UserPromptSubmit, PostToolUse, PostToolUseFailure, Stop, SubagentStop, ConfigChange | `decision: "block"`, `reason`                                                                          |
| `hookSpecificOutput`          | PreToolUse                                                                          | `permissionDecision` (allow/deny/ask), `permissionDecisionReason`, `updatedInput`, `additionalContext` |
| `hookSpecificOutput.decision` | PermissionRequest                                                                   | `decision.behavior` (allow/deny), `updatedInput`, `updatedPermissions`, `message`                      |
| Exit code 2 only              | TeammateIdle, TaskCompleted                                                         | stderr is fed back as feedback                                                                         |
| Stdout path                   | WorktreeCreate                                                                      | Hook prints absolute path to created worktree                                                          |
| No decision control           | Notification, SessionEnd, PreCompact, WorktreeRemove                                | Side effects only (logging, cleanup)                                                                   |

### Async Hooks

Command hooks support `"async": true` to run in the background without blocking. Output is delivered on the next conversation turn via `systemMessage` or `additionalContext`. Async hooks cannot block or return decisions.

### Key Environment Variables

- `$CLAUDE_PROJECT_DIR` — project root
- `${CLAUDE_PLUGIN_ROOT}` — plugin root directory
- `$CLAUDE_CODE_REMOTE` — `"true"` in remote web environments
- `$CLAUDE_ENV_FILE` — (SessionStart only) file path for persisting environment variables

---

## VS Code / GitHub Copilot Hook Events (8 events, Preview)

Source: <https://code.visualstudio.com/docs/copilot/customization/hooks>

Status: Preview in VS Code 1.109.3 (as of March 2026)

### Event Summary

| Event            | When it fires                     | Blockable?                                     |
| ---------------- | --------------------------------- | ---------------------------------------------- |
| SessionStart     | New agent session begins          | No (context injection via `additionalContext`) |
| UserPromptSubmit | User submits a prompt             | Yes (via common output `continue: false`)      |
| PreToolUse       | Before agent invokes a tool       | Yes (allow/deny/ask via `hookSpecificOutput`)  |
| PostToolUse      | After tool completes successfully | Yes (block further processing)                 |
| PreCompact       | Before context compaction         | No                                             |
| SubagentStart    | Subagent spawned                  | No (context injection)                         |
| SubagentStop     | Subagent completes                | Yes (force continue)                           |
| Stop             | Agent session ends                | Yes (force continue)                           |

### Hook Handler Types

VS Code currently supports **command only** — no http, prompt, or agent handler types.

### Configuration Locations

| Location                      | Scope                                   |
| ----------------------------- | --------------------------------------- |
| `.github/hooks/*.json`        | Project-specific hooks shared with team |
| `.claude/settings.json`       | Workspace-level hooks                   |
| `.claude/settings.local.json` | Local workspace hooks (not committed)   |
| `~/.claude/settings.json`     | Personal hooks across all workspaces    |

Workspace hooks take precedence over user hooks for the same event type.

### Configuration Format

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "./scripts/validate-tool.sh",
        "timeout": 15
      }
    ],
    "PostToolUse": [
      {
        "type": "command",
        "command": "npx prettier --write \"$TOOL_INPUT_FILE_PATH\""
      }
    ]
  }
}
```

### Hook Command Properties

| Property  | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| `type`    | string | Must be `"command"`                       |
| `command` | string | Default command to run (cross-platform)   |
| `windows` | string | Windows-specific command override         |
| `linux`   | string | Linux-specific command override           |
| `osx`     | string | macOS-specific command override           |
| `cwd`     | string | Working directory (relative to repo root) |
| `env`     | object | Additional environment variables          |
| `timeout` | number | Timeout in seconds (default: 30)          |

### Common Input Fields (via stdin)

```json
{
  "timestamp": "2026-02-09T10:30:00.000Z",
  "cwd": "/path/to/workspace",
  "sessionId": "session-identifier",
  "hookEventName": "PreToolUse",
  "transcript_path": "/path/to/transcript.json"
}
```

### Exit Code Semantics

| Exit Code | Meaning                                                          |
| --------- | ---------------------------------------------------------------- |
| 0         | Success — parse stdout as JSON                                   |
| 2         | Blocking error — stop processing and show error to model         |
| Other     | Non-blocking warning — show warning to user, continue processing |

### Decision Control

**PreToolUse** — same `hookSpecificOutput` pattern as Claude Code:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked by policy",
    "updatedInput": {},
    "additionalContext": "..."
  }
}
```

Permission priority (multiple hooks): `deny` > `ask` > `allow`

**PostToolUse** — top-level `decision: "block"` with `reason`

**Stop / SubagentStop** — `hookSpecificOutput` with `decision: "block"` and `reason`

**SessionStart / SubagentStart** — `hookSpecificOutput` with `additionalContext`

### Compatibility Notes

- VS Code parses Claude Code's hook format, including matcher syntax, but **currently ignores matcher values** (hooks fire for all tools).
- VS Code converts Copilot CLI's `lowerCamelCase` event names (e.g., `preToolUse`) to PascalCase (`PreToolUse`).

---

## Cross-Tool Comparison

### Common Events (8 — safe abstraction target)

The 8 VS Code events are a **pure subset** of Claude Code's 18. These share identical JSON wire format (stdin input, stdout output, exit codes 0/2):

| Event            | Claude Code | VS Code / Copilot |
| ---------------- | ----------- | ----------------- |
| SessionStart     | Yes         | Yes               |
| UserPromptSubmit | Yes         | Yes               |
| PreToolUse       | Yes         | Yes               |
| PostToolUse      | Yes         | Yes               |
| Stop             | Yes         | Yes               |
| SubagentStart    | Yes         | Yes               |
| SubagentStop     | Yes         | Yes               |
| PreCompact       | Yes         | Yes               |

### Claude Code Only (10 additional events)

| Event              | Purpose                                |
| ------------------ | -------------------------------------- |
| PermissionRequest  | Fine-grained permission dialog control |
| PostToolUseFailure | React to tool failures                 |
| Notification       | Hook into notification system          |
| TeammateIdle       | Agent team quality gates               |
| TaskCompleted      | Task completion quality gates          |
| ConfigChange       | Config change auditing/blocking        |
| WorktreeCreate     | Custom VCS worktree creation           |
| WorktreeRemove     | Worktree cleanup                       |
| SessionEnd         | Session termination cleanup            |

### Handler Type Support

| Handler Type       | Claude Code | VS Code / Copilot |
| ------------------ | ----------- | ----------------- |
| `command`          | Yes         | Yes               |
| `http`             | Yes         | No                |
| `prompt` (LLM)     | Yes         | No                |
| `agent` (subagent) | Yes         | No                |

### Config Format Compatibility

Both tools use the same top-level JSON structure:

```json
{
  "hooks": {
    "EventName": [
      {
        "type": "command",
        "command": "..."
      }
    ]
  }
}
```

Claude Code adds a `matcher` + nested `hooks` array layer:

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolRegex",
        "hooks": [{ "type": "command", "command": "..." }]
      }
    ]
  }
}
```

VS Code parses this matcher format but currently ignores matcher values.

---

## Brainstorm: Prompt-Level Hook Injection (Template Partials)

Rather than generating separate hook config files, inject hook-like **rules** directly into the agent instruction files that awa already produces. Awa does this to some degree today (e.g., "you SHALL run `awa check` after modifying specs"). This approach makes it more structured:

```markdown
<hooks>
  <on event="spec-file-modified" run="awa check --spec-only" />
  <on event="code-file-modified" run="awa check" />
  <on event="task-completed" run="npm run build && npm test" />
</hooks>
```

Tools that understand structured hooks parse these natively; tools that don't still see them as strong instructions in the agent's system prompt.

### Pros

- **Works today** — degrades gracefully to instructional text for tools without native hook support
- **No separate files** — lives inside existing agent config files (CLAUDE.md, copilot-instructions.md, etc.)
- **Familiar format** — XML-like markup fits existing awa partial/template patterns
- **Zero-cost bridge** — pairs with any other hook approach, adding compliance pressure now while native hooks are designed
- **Versioned with instructions** — hooks and agent rules live in the same artifact, keeping intent co-located

### Cons

- **Advisory only** — not truly enforced for tools that don't parse structured hook tags
- **Potential duplication** — overlaps with what's in `.awa/rules/*.md` and native hook configs
- **Compliance varies** — effectiveness depends on model obedience to structured markup vs plain text (assumed but not guaranteed)

### Implementation Sketch

1. Define a `<hooks>` block in the `awa.core.md` partial (or a new `_partials/awa.hooks.md`)
2. Populate it from a normalized hook definition in `.awa.toml` during `awa template generate`
3. For tools with native hook support (Claude Code, VS Code), also generate the proper `.claude/settings.json` / `.github/hooks/*.json`
4. The prompt-level hooks serve as the fallback / reinforcement layer

---

## Implications for awa

### Normalized Abstraction

The 8 common events provide a safe cross-tool abstraction surface. awa could define hooks once (in `.awa.toml` or a dedicated config) and generate the correct format for each tool via `awa template generate`.

### Most Valuable Events for SDD Workflow

| Event                        | awa Use Case                                                |
| ---------------------------- | ----------------------------------------------------------- |
| **PostToolUse** (Write/Edit) | Run `awa check --spec-only --summary` after spec file edits |
| **PostToolUse** (Write/Edit) | Run `awa check --summary` after code file edits             |
| **Stop**                     | Verify `awa check` passes before agent stops                |
| **SessionStart**             | Inject project context (architecture summary, active tasks) |
| **PreToolUse** (Write)       | Validate spec file structure before write                   |

### Format Considerations

- The flat VS Code format (no matcher nesting) is the lowest common denominator
- Claude Code's matcher nesting is a superset — awa can generate the richer format for Claude while using the flat format for VS Code
- `command` is the only universally supported handler type
- Exit code semantics are identical across both tools
