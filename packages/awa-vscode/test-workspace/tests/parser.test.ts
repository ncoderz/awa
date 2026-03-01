// @awa-test: EX_P-1
// @awa-test: EX-1_AC-1
// @awa-test: EX-1_AC-2

import { parseInput } from '../src/parser';

describe('Parser', () => {
  // @awa-test: EX-1_AC-1
  it('should parse valid JSON input', () => {
    const result = parseInput('{"hello": "world"}');
    expect(result.type).toBe('object');
  });

  // @awa-test: EX-1_AC-2
  it('should throw on invalid input', () => {
    expect(() => parseInput('')).toThrow('Invalid input');
  });

  // @awa-test: EX_P-1
  it('should be idempotent', () => {
    const a = parseInput('42');
    const b = parseInput('42');
    expect(a).toEqual(b);
  });
});
