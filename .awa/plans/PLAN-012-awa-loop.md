# PLAN-012: `awa loop` — Ralph Loop Orchestration for Autonomous Task Execution

STATUS: in-progress
DIRECTION: top-down
TRACEABILITY: New feature — new CLI command

## Context

LLM coding agents lose context and "get bored" during long sessions. The Ralph Loop pattern (Geoffrey Huntley) solves this by spawning fresh agent instances in a loop — same prompt every iteration, but the file state on disk changes between runs because each agent commits its work. AWA's structured artifacts (task files with checkable items, specs, architecture) are a natural fit as the "backing specifications" for a Ralph Loop.

AWA currently generates agent config files. This plan extends it to also *orchestrate* agent execution in a loop, using task files as the backlog and completion signal.

## Goal

`awa loop` reads a task file, assembles a prompt from AWA specs, and repeatedly spawns an agent CLI process until all tasks are checked off or max iterations are reached. AWA owns the prompt assembly and completion detection; the user provides the agent command string.

```
awa loop --task .awa/tasks/TASK-FOO-bar-001.md --max 10
```

## Design Decisions

### Agent invocation: user-provided command string

AWA does not abstract over agent CLIs. The user provides the full command string:

```toml
[loop]
agent = "claude -p --dangerously-skip-permissions"
max-iterations = 10
```

Rationale:
- Agent CLI landscape is wide and growing fast (Claude, Copilot, Codex, Gemini, Kilo, OpenCode, Aider, Goose, plus new ones constantly)
- Each has different invocation quirks (stdin vs flag, different auto-approve flags)
- AWA shouldn't maintain an agent abstraction layer
- User already knows their agent's CLI

Known agents and their invocation patterns (for documentation, not code):

| Agent | Example command | Prompt delivery |
|-------|----------------|-----------------|
| Claude Code | `claude -p --dangerously-skip-permissions` | `-p` flag (prompt as arg) |
| GitHub Copilot | `gh copilot` | TBD |
| Codex CLI | `codex exec --full-auto` | stdin |
| Gemini CLI | `gemini --yolo` | stdin |
| Kilo Code CLI | `kilo --auto` | stdin |
| OpenCode | `opencode run` | stdin / sessions |
| Aider | `aider --yes-always --message` | `--message` flag |
| Goose | `goose run` | stdin |

### Prompt delivery modes

Different agents accept prompts differently. Three modes:

- `stdin` (default): pipe prompt to agent's stdin
- `arg`: pass prompt as a command-line argument (appended to agent command)
- `file`: write prompt to a temp file, agent reads it (for agents that read instruction files)

```toml
[loop]
agent = "claude -p --dangerously-skip-permissions"
prompt-mode = "arg"  # "stdin" | "arg" | "file"
```

### Prompt assembly

Each iteration, AWA assembles the same prompt from:
1. Architecture summary (from `.awa/specs/ARCHITECTURE.md` — condensed)
2. Relevant rules (from `.awa/rules/*.md`)
3. The task file itself (so agent sees what's done and what remains)
4. Linked specs (REQ, DESIGN referenced in task file header)
5. A static instruction block: "Find the first unchecked task. Implement it. Run tests. Mark it done. Commit. Exit."

The prompt is identical every iteration — only the task file content changes on disk (because the previous agent checked items off and committed).

### Completion detection

After each agent exits, AWA re-reads the task file and counts `- [ ]` vs `- [x]` items. Done when:
- All items are `- [x]`, OR
- Max iterations reached, OR
- Agent exits with a non-zero code AND no task was checked off (stall detection)

### Quality gate: `awa check` (optional)

After each iteration, optionally run `awa check` to verify traceability. If check fails, the loop can either continue (warn) or stop (strict mode).

```toml
[loop]
check-after = true       # run awa check after each iteration
check-strict = false     # true = stop loop on check failure
```

## Steps

### Phase 1: Specifications

- [ ] Create feature context → `.awa/specs/FEAT-LOOP-awa-loop.md`
- [ ] Create requirements → `.awa/specs/REQ-LOOP-awa-loop.md`
- [ ] Create design → `.awa/specs/DESIGN-LOOP-awa-loop.md`

### Phase 2: Core — Task Parser

- [ ] Create task file parser — reads markdown, extracts `- [ ]` / `- [x]` items, returns counts and next unchecked item
- [ ] Create task parser tests

### Phase 3: Core — Prompt Assembler

- [ ] Create prompt assembler — reads task file header (SOURCE, FEATURE references), loads linked specs, assembles full prompt text
- [ ] Create prompt assembler tests

### Phase 4: Core — Agent Runner

- [ ] Create agent runner — spawns child process with configurable command string, delivers prompt via stdin/arg/file mode, waits for exit
- [ ] Create agent runner tests (mock child process)

### Phase 5: Core — Loop Controller

- [ ] Create loop controller — orchestrates iterations: assemble prompt → spawn agent → check completion → repeat or exit
- [ ] Implement stall detection (agent exits without checking off any task)
- [ ] Implement max-iterations guard
- [ ] Optional: run `awa check` after each iteration
- [ ] Create loop controller tests

### Phase 6: CLI Integration

- [ ] Add `awa loop` command to CLI with options: `--task`, `--agent`, `--max`, `--prompt-mode`, `--check`, `--check-strict`
- [ ] Add `[loop]` section to config loader for `.awa.toml` defaults
- [ ] Create CLI tests

### Phase 7: Reporting

- [ ] Display iteration progress: `[3/10] 5/12 tasks complete`
- [ ] Display elapsed time per iteration
- [ ] Final summary: total iterations, tasks completed, pass/fail
- [ ] Support `--json` output for CI integration

### Phase 8: Documentation

- [ ] Update ARCHITECTURE.md with Loop Orchestrator component
- [ ] Update `docs/CLI.md` with `awa loop` command reference
- [ ] Add loop configuration to `.awa.toml` documentation
- [ ] Create examples showing usage with Claude, Codex, Gemini, Kilo, OpenCode

## Risks

- **Agent CLI instability**: Agent CLIs are third-party and change frequently. Mitigated by not abstracting over them — the user provides the exact command.
- **Prompt too large**: If specs are big, the assembled prompt may exceed agent context limits. Mitigation: truncation strategy, or let user curate what's included via config.
- **Stall loops**: Agent may fail the same task repeatedly. Mitigation: stall detection (no progress after N iterations → stop), max-iterations hard limit.
- **Platform differences**: `child_process.spawn` behavior varies (shell escaping, signal handling). Mitigation: use `spawn` with `shell: true` and test on macOS/Linux.
- **Cost**: Each iteration costs API credits. Loop should display clear warnings and require explicit opt-in (no accidental runaway loops).

## Dependencies

- Task file format is stable (already in use across 10+ task files)
- Config loader supports `[loop]` table (needs extension, similar to existing `[check]` table)

## Completion Criteria

- [ ] `awa loop --task TASK-*.md --agent "echo test"` runs and completes
- [ ] Loop exits when all tasks are checked
- [ ] Loop exits at max-iterations
- [ ] Stall detection stops runaway loops
- [ ] Progress reporting shows iteration count and task completion
- [ ] `awa check` integration works as optional gate
- [ ] Config file supports `[loop]` defaults
- [ ] Documentation complete with multi-agent examples

## Open Questions

- [ ] Should the prompt include the full linked spec files, or just a summary/reference? Full specs are more reliable but may hit context limits.
- [ ] Should there be a `--dry-run` mode that shows the assembled prompt without spawning the agent? Useful for debugging.
- [ ] Should AWA commit between iterations if the agent doesn't? Or trust the agent to commit?
- [ ] Should `awa loop` support plan files (`PLAN-*.md`) in addition to task files? Plans also have checkboxes.

## References

- Ralph Loop pattern: https://ghuntley.com/loop/
- ralph-loop reference implementation: https://github.com/syuya2036/ralph-loop
- ARCHITECTURE: .awa/specs/ARCHITECTURE.md
- Task schema: .awa/.agent/schemas/TASK.schema.yaml
- Similar pattern: .awa/plans/PLAN-007-awa-watch.md (watch loop on diff command)

## Change Log

- 012 (2026-02-28): Initial plan from brainstorm session
