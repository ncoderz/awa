---
description: Implement code and tests based on architecture, requirements, and design (plan optional)
argument-hint: "<task|plan|design> [<instructions>]"
---

# Create or Update Design(s)

## Bootstrap

<tool name="read_file">
 <read path=".zen/.agent/zen.core.md" required="true" error="on not found" />
 <read path=".zen/rules/*.md" required="true" />
 <read path=".zen/specs/ARCHITECTURE.md" required="true" error="on not found" />
</tool>

## User Input

```text
${input:instruction}
```

You **MUST** consider the user input before proceeding (if not empty).

## Inputs

<file type="architecture" path=".zen/specs/ARCHITECTURE.md" />
<file type="requirements" path=".zen/specs/REQ-{code}-{feature-name}.md" required="if relevant" />
<file type="design" path=".zen/specs/DESIGN-{code}-{feature-name}.md" required="if relevant" />
<file type="api" path=".zen/specs/API-{code}-{feature-name}.md" required="if relevant" />
<file type="tasks" path=".zen/tasks/API-{code}-{feature-name}.md" required="if relevant" />

## Action

Implement code and tests based on architecture, requirements, and design (plan optional) as specified in the instruction above, following Zen conventions.

## Traceability Markers

You MUST add these markers to create explicit traces:

```
// @zen-component: {code}-{ComponentName}
```
Place at the top of each file/module that implements a design component.

```
// @zen-impl: AC-{code}-{n}.{m}
```
Place above code that satisfies an acceptance criterion. Multiple markers allowed per block.

```
// @zen-test: P-{code}-{n}
// @zen-test: AC-{code}-{n}.{m}
```
Place above tests. Use P- for property-based tests, AC- for direct acceptance tests.

## Implementation Process

1. PARSE DESIGN
   - Identify components and their interfaces
   - Note IMPLEMENTS references (which ACs each component covers)
   - Note properties (P-) and what they VALIDATE

2. PARSE REQ
   - Understand acceptance criteria being implemented
   - Note criterion types (event, ubiquitous, conditional, etc.)

3. IF TASKS PROVIDED
   - Follow task order strictly
   - Implement one task at a time
   - Report completion of each task before proceeding

4. IF NO TASKS
   - Implement components in dependency order
   - Start with bootstrapping, then types/interfaces, then core logic, then entry points

5. FOR EACH COMPONENT
   - Add @zen-component marker at file/module top
   - Implement interface as specified in DESIGN
   - Add @zen-impl marker above code satisfying each AC
   - One AC may require multiple @zen-impl markers across files

6. FOR EACH TEST
   - Property tests (@zen-test: P-): Use property-based testing framework
   - Acceptance tests (@zen-test: AC-): Use example-based assertions
   - A single test may verify multiple ACs or properties

## Ouput File(s)

- source code files with appropriate markers
- test files with appropriate markers
- associated project configuration files if needed

## Constraints

- Never implement without a corresponding DESIGN component
- Never add @zen-impl without understanding the AC's criterion type
- Prefer one @zen-component per file; split if file covers multiple components
- Keep @zen-impl markers close to the implementing code, not at file top
- If AC cannot be fully satisfied, add marker with comment: `// @zen-impl: AC-x-n.m (partial: reason)`
- If PLAN task is blocked, report blocker and await instruction

## Example

Given:
- REQ-cfg-1: Config Loading with AC-cfg-1.1 (load from path), AC-cfg-1.2 (merge with defaults)
- DESIGN component cfg-ConfigLoader with IMPLEMENTS: AC-cfg-1.1, AC-cfg-1.2
- DESIGN property P-cfg-1 [Default Preservation] VALIDATES: AC-cfg-1.2

Output:

```typescript
// FILE: src/config/loader.ts

// @zen-component: cfg-ConfigLoader

import { Config, RawConfig } from './types';
import { defaults } from './defaults';

// @zen-impl: AC-cfg-1.1
export async function load(path: string): Promise {
  const content = await fs.readFile(path, 'utf8');
  return parse(content);
}

// @zen-impl: AC-cfg-1.2
export function merge(raw: RawConfig): Config {
  return { ...defaults, ...raw };
}
```

```typescript
// FILE: tests/config/loader.test.ts

import * as fc from 'fast-check';

// @zen-test: P-cfg-1
test.prop([fc.object()])('preserves defaults for missing keys', (partial) => {
  const result = merge(partial);
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in partial)) {
      expect(result[key]).toBe(value);
    }
  }
});

// @zen-test: AC-cfg-1.1
test('loads config from valid path', async () => {
  const config = await load('fixtures/valid.toml');
  expect(config).toBeDefined();
});
```

## Rules

You SHALL write code at the level of a technical lead.
You SHALL consider edge cases and error handling.
You SHALL use KISS, and YAGNI principles. Do not create more than requested.
You SHALL write tests to cover the requirements and success criteria. If no tests exist for the written code, you MUST create them.
You SHALL actively research existing code to apply the DRY principle.
You SHALL consider edge cases, UX, technical constraints, success criteria.
You MUST NOT add features or functionality beyond what is specified or requested.
You SHALL use any tools you need to help write and test code (e.g. MCP tools for result visualization).
You MUST add traceability markers (`@zen-component`, `@zen-impl`, `@zen-test`) to all code and tests.
You MUST ensure every feature implementation traces to at least one acceptance criterion.
You MUST ensure every test file traces to at least one design property.
You SHALL clarify open points with user.
You MAY use todos and tools as needed.

