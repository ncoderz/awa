// @awa-test: EX_P-2
// @awa-test: EX-2_AC-1
// @awa-test: EX-2_AC-2

import { formatOutput } from '../src/formatter';

describe('Formatter', () => {
  // @awa-test: EX-2_AC-1
  it('should format a data object', () => {
    const result = formatOutput({ type: 'string', value: 'hello' });
    expect(result).toContain('hello');
  });

  // @awa-test: EX-2_AC-2
  it('should return empty string for empty object', () => {
    const result = formatOutput({ type: 'object', value: {} });
    expect(result).toBe('');
  });

  // @awa-test: EX_P-2
  it('should be deterministic', () => {
    const data = { type: 'number', value: 42 };
    const a = formatOutput(data);
    const b = formatOutput(data);
    expect(a).toBe(b);
  });
});
