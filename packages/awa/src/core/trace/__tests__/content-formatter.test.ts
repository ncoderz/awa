// @awa-test: TRC-7_AC-1

import { describe, expect, it } from 'vitest';
import { formatContentJson, formatContentMarkdown } from '../content-formatter.js';
import type { ContentSection } from '../types.js';

function makeSection(overrides: Partial<ContentSection> = {}): ContentSection {
  return {
    type: 'requirement',
    filePath: '.awa/specs/REQ-TEST.md',
    startLine: 10,
    endLine: 20,
    content: '### TEST-1: Test requirement\n\nSome content here.',
    priority: 2,
    ...overrides,
  };
}

describe('formatContentMarkdown', () => {
  it('should render heading, section type, and provenance', () => {
    const section = makeSection();
    const result = formatContentMarkdown([section], 'TEST-1', null);

    expect(result).toContain('# Context: TEST-1');
    expect(result).toContain('## Requirement');
    expect(result).toContain('> From: .awa/specs/REQ-TEST.md (lines 10-20)');
    expect(result).toContain('### TEST-1: Test requirement');
  });

  it('should wrap code sections in fenced code blocks', () => {
    const section = makeSection({
      type: 'implementation',
      filePath: 'src/core/parser.ts',
      content: 'export function parse() {\n  return {};\n}',
    });
    const result = formatContentMarkdown([section], 'TEST-1_AC-1', null);

    expect(result).toContain('## Implementation');
    expect(result).toContain('```typescript');
    expect(result).toContain('export function parse()');
    expect(result).toContain('```');
  });

  it('should group sections by type with H2 headings', () => {
    const sections = [
      makeSection({ type: 'requirement', priority: 2 }),
      makeSection({
        type: 'implementation',
        filePath: 'src/a.ts',
        content: 'code()',
        priority: 5,
      }),
      makeSection({
        type: 'test',
        filePath: 'src/__tests__/a.test.ts',
        content: 'test("x", () => {})',
        priority: 6,
      }),
    ];
    const result = formatContentMarkdown(sections, 'TEST-1', null);

    const reqIdx = result.indexOf('## Requirement');
    const implIdx = result.indexOf('## Implementation');
    const testIdx = result.indexOf('## Test');
    expect(reqIdx).toBeLessThan(implIdx);
    expect(implIdx).toBeLessThan(testIdx);
  });

  it('should append footer when present', () => {
    const result = formatContentMarkdown(
      [makeSection()],
      'TEST-1',
      '... 3 more sections omitted (use --max-tokens to increase)'
    );
    expect(result).toContain('---');
    expect(result).toContain('3 more sections omitted');
  });

  it('should not include footer separator when footer is null', () => {
    const result = formatContentMarkdown([makeSection()], 'TEST-1', null);
    expect(result).not.toContain('---');
  });
});

describe('formatContentJson', () => {
  it('should return valid JSON with sections and metadata', () => {
    const sections = [
      makeSection({ content: 'a'.repeat(100) }),
      makeSection({
        type: 'implementation',
        filePath: 'src/x.ts',
        content: 'b'.repeat(200),
        priority: 5,
      }),
    ];
    const output = formatContentJson(sections, 'TEST-1', null);
    const parsed = JSON.parse(output);

    expect(parsed.query).toBe('TEST-1');
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.estimatedTokens).toBe(75); // (100+200)/4
    expect(parsed.filesIncluded).toBe(2);
    expect(parsed.truncated).toBeUndefined();
  });

  it('should include truncation info when footer is present', () => {
    const output = formatContentJson(
      [makeSection({ content: 'x'.repeat(40) })],
      'TEST-1',
      '... 2 more sections omitted'
    );
    const parsed = JSON.parse(output);

    expect(parsed.truncated).toBe(true);
    expect(parsed.truncationMessage).toContain('2 more sections omitted');
  });

  it('should count unique files', () => {
    const sections = [
      makeSection({ filePath: 'a.md', content: 'x' }),
      makeSection({ filePath: 'a.md', content: 'y' }),
      makeSection({ filePath: 'b.ts', content: 'z' }),
    ];
    const output = formatContentJson(sections, 'Q', null);
    const parsed = JSON.parse(output);
    expect(parsed.filesIncluded).toBe(2);
  });
});
