import type { Command } from 'commander';

type OptionSource = ReturnType<Command['getOptionValueSource']>;

/**
 * Return a CLI option value only when explicitly provided by the user.
 *
 * Commander assigns defaults (for example, boolean flags become false), which
 * should not override values loaded from configuration files.
 */
export function cliProvidedOption<T>(
  command: Command,
  options: Record<string, unknown>,
  key: string,
): T | undefined {
  const source = command.getOptionValueSource(key) as OptionSource;
  if (source === 'cli' || source === 'env') {
    return options[key] as T;
  }
  return undefined;
}
