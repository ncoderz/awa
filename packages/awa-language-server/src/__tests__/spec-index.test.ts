import { describe, expect, it } from 'vitest';
import {
  type LspMarkerInfo,
  type LspSpecIndex,
  parseSpecContentForLsp,
  scanCodeContentForLsp,
} from '../spec-index.js';

describe('parseSpecContentForLsp', () => {
  it('extracts requirement IDs with text', () => {
    const content = `## Requirements

### DIFF-1: Produces unified diff for modified files

Some description.

### DIFF-2: Handles new files in output
`;
    const result = parseSpecContentForLsp('/fake/REQ-DIFF-diff.md', content);
    expect(result.size).toBe(2);

    const diff1 = result.get('DIFF-1');
    expect(diff1).toBeDefined();
    expect(diff1?.type).toBe('requirement');
    expect(diff1?.text).toBe('Produces unified diff for modified files');
    expect(diff1?.line).toBe(3);
    expect(diff1?.featureCode).toBe('DIFF');
    expect(diff1?.filePath).toBe('/fake/REQ-DIFF-diff.md');

    const diff2 = result.get('DIFF-2');
    expect(diff2?.text).toBe('Handles new files in output');
  });

  it('extracts AC IDs with text', () => {
    const content = `### DIFF-1: Some requirement

- DIFF-1_AC-1 Output must be valid unified diff format
- DIFF-1_AC-2 Must include file paths as headers
- [ ] DIFF-2_AC-1 New files must appear in diff
`;
    const result = parseSpecContentForLsp('/fake/REQ-DIFF-diff.md', content);

    const ac1 = result.get('DIFF-1_AC-1');
    expect(ac1?.type).toBe('ac');
    expect(ac1?.text).toBe('Output must be valid unified diff format');
    expect(ac1?.featureCode).toBe('DIFF');

    const ac2 = result.get('DIFF-1_AC-2');
    expect(ac2?.text).toBe('Must include file paths as headers');

    const ac3 = result.get('DIFF-2_AC-1');
    expect(ac3?.text).toBe('New files must appear in diff');
  });

  it('extracts property IDs with text', () => {
    const content = `### Properties

- DIFF_P-1 DiffIsIdempotent: running diff twice gives same result
`;
    const result = parseSpecContentForLsp('/fake/DESIGN-DIFF-diff.md', content);

    const prop = result.get('DIFF_P-1');
    expect(prop?.type).toBe('property');
    expect(prop?.featureCode).toBe('DIFF');
    expect(prop?.text).toContain('DiffIsIdempotent');
  });

  it('extracts component names', () => {
    const content = `## Components

### DIFF-DiffEngine

IMPLEMENTS: DIFF-1_AC-1

### DIFF-DiffCommand

IMPLEMENTS: DIFF-7_AC-1
`;
    const result = parseSpecContentForLsp('/fake/DESIGN-DIFF-diff.md', content);

    const engine = result.get('DIFF-DiffEngine');
    expect(engine?.type).toBe('component');
    expect(engine?.text).toBe('DIFF-DiffEngine');
    expect(engine?.featureCode).toBe('DIFF');

    expect(result.has('DIFF-DiffCommand')).toBe(true);
  });

  it('does not confuse requirements with components', () => {
    const content = `### DIFF-1: This is a requirement

### DIFF-DiffEngine
`;
    const result = parseSpecContentForLsp('/fake/DESIGN-DIFF-diff.md', content);

    const req = result.get('DIFF-1');
    expect(req?.type).toBe('requirement');

    const comp = result.get('DIFF-DiffEngine');
    expect(comp?.type).toBe('component');
  });

  it('handles empty content', () => {
    const result = parseSpecContentForLsp('/fake/empty.md', '');
    expect(result.size).toBe(0);
  });

  it('extracts sub-requirement IDs', () => {
    const content = `### DIFF-1.1: Sub-requirement

- DIFF-1.1_AC-1 Sub-requirement criterion
`;
    const result = parseSpecContentForLsp('/fake/REQ-DIFF-diff.md', content);
    expect(result.has('DIFF-1.1')).toBe(true);
    expect(result.get('DIFF-1.1')?.type).toBe('requirement');
    expect(result.has('DIFF-1.1_AC-1')).toBe(true);
    expect(result.get('DIFF-1.1_AC-1')?.type).toBe('ac');
  });
});

describe('scanCodeContentForLsp', () => {
  it('extracts impl markers with column positions', () => {
    const content = `// @awa-impl: DIFF-1_AC-1
function doSomething() {}
`;
    const markers = scanCodeContentForLsp(content);
    expect(markers).toHaveLength(1);
    const m = markers[0] as LspMarkerInfo;
    expect(m.type).toBe('impl');
    expect(m.id).toBe('DIFF-1_AC-1');
    expect(m.line).toBe(1);
    // The marker prefix is 15 chars; DIFF-1_AC-1 starts at col 14 (0-indexed)
    expect(m.startColumn).toBe(14);
    expect(m.endColumn).toBe(14 + 'DIFF-1_AC-1'.length);
  });

  it('extracts test markers', () => {
    const content = `  // @awa-test: DIFF_P-1
  it('test', () => {});
`;
    const markers = scanCodeContentForLsp(content);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.type).toBe('test');
    expect(markers[0]?.id).toBe('DIFF_P-1');
  });

  it('extracts component markers', () => {
    const content = `// @awa-component: DIFF-DiffEngine
`;
    const markers = scanCodeContentForLsp(content);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.type).toBe('component');
    expect(markers[0]?.id).toBe('DIFF-DiffEngine');
  });

  it('handles multiple IDs on one marker line', () => {
    const content = `// @awa-impl: DIFF-1_AC-1, DIFF-1_AC-2
`;
    const markers = scanCodeContentForLsp(content);
    expect(markers).toHaveLength(2);
    expect(markers[0]?.id).toBe('DIFF-1_AC-1');
    expect(markers[1]?.id).toBe('DIFF-1_AC-2');
    // The second ID should have a higher startColumn than the first
    expect((markers[1]?.startColumn ?? 0) > (markers[0]?.startColumn ?? 0)).toBe(true);
  });

  it('handles multiple markers in a file', () => {
    const content = `// @awa-component: DIFF-DiffEngine
// @awa-impl: DIFF-1_AC-1
// @awa-impl: DIFF-2_AC-1
function foo() {}
// @awa-test: DIFF_P-1
it('test', () => {});
`;
    const markers = scanCodeContentForLsp(content);
    expect(markers).toHaveLength(4);
    expect(markers.filter((m) => m.type === 'impl')).toHaveLength(2);
    expect(markers.filter((m) => m.type === 'test')).toHaveLength(1);
    expect(markers.filter((m) => m.type === 'component')).toHaveLength(1);
  });

  it('returns empty array for content with no markers', () => {
    const content = `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`;
    const markers = scanCodeContentForLsp(content);
    expect(markers).toHaveLength(0);
  });

  it('correctly tracks line numbers', () => {
    const content = `line 1
line 2
// @awa-impl: DIFF-3_AC-1
line 4
`;
    const markers = scanCodeContentForLsp(content);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.line).toBe(3);
  });
});

describe('LspSpecIndex structure', () => {
  it('should have all required maps', () => {
    const index: LspSpecIndex = {
      ids: new Map(),
      markers: new Map(),
      implementations: new Map(),
      tests: new Map(),
      components: new Map(),
    };
    expect(index.ids).toBeDefined();
    expect(index.markers).toBeDefined();
    expect(index.implementations).toBeDefined();
    expect(index.tests).toBeDefined();
    expect(index.components).toBeDefined();
  });
});
