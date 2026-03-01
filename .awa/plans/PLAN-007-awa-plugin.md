# `awa plugin` — Extensible Check Rules

STATUS: in-progress
DIRECTION: top-down

## Context

`awa check` ships with built-in validators (orphaned markers, uncovered ACs, schema rules, cross-refs). Teams inevitably need custom rules: "every AC must have an implementation before merging", "component names must match file names", "no spec file may exceed certain complexity metrics". Today, the only option is to fork awa or write external scripts that parse findings JSON.

`awa plugin` introduces a lightweight plugin API for `awa check`, allowing custom JS/TS check rules loaded at runtime.

## Scope

IN SCOPE:
- Plugin declaration in `.awa.toml` config (`[check].plugins` array)
- Plugin resolution: local file paths (`.js`, `.ts` via dynamic import), npm package names
- Plugin API: context object with access to spec data, marker data, TraceIndex, and a reporting interface
- Plugin lifecycle: load → validate → execute (after built-in checks) → merge findings
- TypeScript types package for plugin authors (`@ncoderz/awa-plugin-types`)

OUT OF SCOPE:
- Plugin marketplace / discovery (future — could integrate with PLAN-006 registry)
- Plugin sandboxing (plugins run with full Node.js access, same as any devDependency)
- Plugin for template rendering (only `awa check` initially)
- Configuration per-plugin (future enhancement)

## Plugin API

```typescript
// @ncoderz/awa-plugin-types

export interface AwaPluginContext {
  // Data from Check Engine
  readonly specs: SpecParseResult;
  readonly markers: MarkerScanResult;
  readonly traceIndex: TraceIndex;       // from PLAN-002
  readonly config: CheckConfig;

  // Reporting
  report(finding: PluginFinding): void;

  // Utilities
  readonly logger: PluginLogger;
}

export interface PluginFinding {
  readonly severity: 'error' | 'warning';
  readonly code: string;              // plugin-namespaced, e.g. "my-plugin/no-orphan-tests"
  readonly message: string;
  readonly filePath?: string;
  readonly line?: number;
  readonly id?: string;
}

export interface PluginLogger {
  debug(msg: string): void;
  info(msg: string): void;
  warn(msg: string): void;
}

export interface AwaPlugin {
  readonly name: string;
  readonly version?: string;
  readonly description?: string;
  check(ctx: AwaPluginContext): void | Promise<void>;
}

// Plugin entry point: default export a plugin object or factory function
export type AwaPluginExport = AwaPlugin | (() => AwaPlugin);
```

## Configuration

```toml
[check]
plugins = [
  "./checks/no-orphan-tests.ts",
  "./checks/component-naming.js",
  "@myorg/awa-check-strict",
]
```

Plugin paths are resolved relative to the config file location. npm package names are resolved via standard Node.js module resolution.

## CLI Interface

No new CLI command—plugins integrate into the existing `awa check` command:

```
awa check [existing options]
  --no-plugins          Skip plugin loading (built-in checks only)
```

Plugin findings appear in the standard check output, prefixed with the plugin name:

```
3 error(s):

  ✖ [my-plugin] Test file has no @awa-test marker (src/__tests__/util.test.ts:1)
  ✖ [my-plugin] Component name does not match file name (src/core/parser.ts:5)
  ✖ Marker 'FOO-1_AC-1' not found in any spec file (src/foo.ts:10)
```

## Steps

### Phase 1: Plugin Types Package

- [ ] Create `src/core/check/plugin-types.ts` exporting `AwaPlugin`, `AwaPluginContext`, `PluginFinding`, `AwaPluginExport`
- [ ] Keep types minimal: only expose read-only access to spec/marker data
- [ ] Export types from package entry point for external plugin authors
- [ ] Document the API contract: plugins MUST NOT mutate context data

### Phase 2: Plugin Loader

- [ ] Create `src/core/check/plugin-loader.ts`
- [ ] Resolve plugin specifiers: local paths (relative to config dir), npm packages
- [ ] Dynamic import each plugin module (`import()`)
- [ ] Validate export: must be `AwaPlugin` object or factory function that returns one
- [ ] Handle `.ts` files: rely on tsx/ts-node if available, or require pre-compilation
- [ ] Collect load errors as findings (severity: error, code: `plugin-load-error`)
- [ ] Unit test with mock plugin modules

### Phase 3: Plugin Execution Harness

- [ ] Create `src/core/check/plugin-runner.ts`
- [ ] Build `AwaPluginContext` from Check Engine results (specs, markers, TraceIndex)
- [ ] Create reporting collector: accumulates `PluginFinding` objects, prefixes with plugin name
- [ ] Execute each plugin's `check()` method sequentially (async-safe with `await`)
- [ ] Catch and wrap plugin errors: runtime exceptions become findings (code: `plugin-runtime-error`)
- [ ] Implement timeout: 30s default per plugin, configurable
- [ ] Convert `PluginFinding` to standard `Finding` type for unified reporting
- [ ] Unit test execution with mock plugins (passing, failing, throwing)

### Phase 4: Integration with Check Command

- [ ] Add `plugins` field to `CheckConfig` (string array, default empty)
- [ ] Add `--no-plugins` flag to check command
- [ ] Load plugins after built-in checks complete
- [ ] Merge plugin findings into combined findings array
- [ ] Plugin findings respect `--allow-warnings` just like built-in findings
- [ ] Plugin findings appear in both text and JSON output formats
- [ ] Update config builder to read `[check].plugins` from TOML

### Phase 5: Example Plugins

- [ ] Create `examples/plugins/no-orphan-tests.ts` — warns on test files without `@awa-test`
- [ ] Create `examples/plugins/component-file-match.ts` — validates component names match file names
- [ ] Document plugin creation in docs/PLUGINS.md (API, examples, testing)

### Phase 6: Plugin Author DX

- [ ] Ensure TypeScript types are exported from the package for autocompletion
- [ ] Document how to test plugins in isolation (create mock context)
- [ ] Document plugin naming conventions (`plugin-name/rule-code`)

## Edge Cases

- Plugin file not found → finding with `plugin-load-error`, continue with remaining plugins
- Plugin throws during `check()` → catch, report as `plugin-runtime-error`, continue
- Plugin reports findings with same code as built-in → prefix with plugin name to disambiguate
- Plugin takes too long → timeout after 30s, report as `plugin-timeout`
- `--no-plugins` flag → skip plugin loading entirely
- Plugin config empty (default) → no plugins loaded, zero overhead
- Circular plugin dependencies → not managed; plugins are independent modules

## Risks

- API STABILITY: once published, the plugin API becomes a compatibility contract. Every change to `SpecParseResult` or `MarkerScanResult` could break plugins. Mitigation: expose a stable subset through `AwaPluginContext`, not raw internal types. Version the API.
- PERFORMANCE: badly written plugins could slow `awa check`. Mitigation: timeout per plugin, document performance expectations.
- SECURITY: plugins execute arbitrary code. Mitigation: same trust model as npm devDependencies — plugins come from the project, not from templates.
- TS LOADING: dynamic import of `.ts` files requires a loader (tsx, ts-node). Mitigation: require pre-compilation to `.js` for production, support `.ts` only in development (document this clearly).
- SCOPE CREEP: requests to extend plugin API to templates, generation, diff. Mitigation: scope to `awa check` only in v1. Design the API so it can expand later without breaking changes.

## Dependencies

- PLAN-002 (`awa trace`): TraceIndex (exposed in plugin context)
- Check Engine: SpecParseResult, MarkerScanResult, CheckConfig, Finding types
- Node.js dynamic import (`import()`) — no external dependencies
- Optional: tsx for `.ts` plugin development

## Completion Criteria

- [ ] `[check].plugins = ["./my-plugin.js"]` loads and executes the plugin
- [ ] Plugin findings appear in check output (text and JSON)
- [ ] Plugin load errors reported as findings (check continues)
- [ ] Plugin runtime errors caught and reported
- [ ] `--no-plugins` skips plugin execution
- [ ] Example plugins demonstrate common use cases
- [ ] Plugin API types exported from package
- [ ] All unit tests pass
- [ ] `awa check` passes

## References

- Check command: src/commands/check.ts
- Check Engine types: src/core/check/types.ts
- ESLint plugin architecture: https://eslint.org/docs/latest/extend/plugins (inspiration)
- PLAN-002: .awa/plans/PLAN-002-awa-trace.md (TraceIndex)
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
