import { Command } from 'commander';
import { describe, expect, it } from 'vitest';

import { cliProvidedOption } from '../option-source.js';

describe('cliProvidedOption', () => {
  it('returns undefined for omitted boolean flags (Commander default)', () => {
    const cmd = new Command('generate').option('--refresh', 'Refresh cache', false);
    cmd.exitOverride();
    cmd.parse(['node', 'generate']);

    const options = cmd.opts<Record<string, unknown>>();
    expect(options.refresh).toBe(false);
    expect(cliProvidedOption<boolean>(cmd, options, 'refresh')).toBeUndefined();
  });

  it('returns boolean value when flag is explicitly provided', () => {
    const cmd = new Command('generate').option('--refresh', 'Refresh cache', false);
    cmd.exitOverride();
    cmd.parse(['node', 'generate', '--refresh']);

    const options = cmd.opts<Record<string, unknown>>();
    expect(cliProvidedOption<boolean>(cmd, options, 'refresh')).toBe(true);
  });

  it('returns undefined for omitted variadic options and value when provided', () => {
    const omitted = new Command('generate').option('--overlay <path...>', 'Overlay paths');
    omitted.exitOverride();
    omitted.parse(['node', 'generate']);

    const omittedOptions = omitted.opts<Record<string, unknown>>();
    expect(cliProvidedOption<string[]>(omitted, omittedOptions, 'overlay')).toBeUndefined();

    const provided = new Command('generate').option('--overlay <path...>', 'Overlay paths');
    provided.exitOverride();
    provided.parse(['node', 'generate', '--overlay', './a', './b']);

    const providedOptions = provided.opts<Record<string, unknown>>();
    expect(cliProvidedOption<string[]>(provided, providedOptions, 'overlay')).toEqual([
      './a',
      './b',
    ]);
  });
});
