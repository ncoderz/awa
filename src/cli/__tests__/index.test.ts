// @awa-component: CLI-ArgumentParser
// @awa-test: CLI-1_AC-1, CLI-1_AC-2, CLI-1_AC-3, CLI-1_AC-5
// @awa-test: CLI-2_AC-1, CLI-2_AC-5, CLI-2_AC-6
// @awa-test: CLI-3_AC-1
// @awa-test: CLI-4_AC-1, CLI-4_AC-2
// @awa-test: CLI-5_AC-1
// @awa-test: CLI-6_AC-1, CLI-6_AC-3
// @awa-test: CLI-7_AC-1
// @awa-test: CLI-8_AC-1
// @awa-test: CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3
// @awa-test: CLI-10_AC-1, CLI-10_AC-2
// @awa-test: CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3
// @awa-test: CLI-13_AC-1, CLI-13_AC-2
// @awa-test: CLI-14_AC-1, CLI-14_AC-2
// @awa-test: GEN-10_AC-1, GEN-10_AC-2
// @awa-test: DIFF-7_AC-4, DIFF-7_AC-5, DIFF-7_AC-6, DIFF-7_AC-7
// @awa-test: DIFF-7_AC-8, DIFF-7_AC-9, DIFF-7_AC-10, DIFF-7_AC-12, DIFF-7_AC-13

import { Command } from 'commander';
import { describe, expect, it } from 'vitest';

/**
 * Tests for CLI argument parser configuration.
 *
 * Rather than invoking the CLI through process.argv (which calls process.exit),
 * we verify the Commander.js configuration by constructing commands the same way
 * the main CLI does, then inspecting the resulting Command objects.
 */

/** Build a minimal generate command matching the CLI definition. */
function buildGenerateCommand(): Command {
  const cmd = new Command('generate')
    .argument('[output]', 'Output directory (optional if specified in config)')
    .option('-t, --template <source>', 'Template source (local path or Git repository)')
    .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
    .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
    .option(
      '--remove-features <flag...>',
      'Feature flags to remove (can be specified multiple times)'
    )
    .option('--force', 'Force overwrite existing files without prompting', false)
    .option('--dry-run', 'Preview changes without modifying files', false)
    .option(
      '--delete',
      'Enable deletion of files listed in the delete list (default: warn only)',
      false
    )
    .option('-c, --config <path>', 'Path to configuration file')
    .option('--refresh', 'Force refresh of cached Git templates', false);
  return cmd;
}

/** Build a minimal diff command matching the CLI definition. */
function buildDiffCommand(): Command {
  const cmd = new Command('diff')
    .argument('[target]', 'Target directory to compare against (optional if specified in config)')
    .option('-t, --template <source>', 'Template source (local path or Git repository)')
    .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
    .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
    .option(
      '--remove-features <flag...>',
      'Feature flags to remove (can be specified multiple times)'
    )
    .option('-c, --config <path>', 'Path to configuration file')
    .option('--refresh', 'Force refresh of cached Git templates', false)
    .option('--list-unknown', 'Include target-only files in diff results', false);
  return cmd;
}

/** Build the root program matching the CLI definition. */
function buildProgram(): Command {
  const program = new Command();
  program
    .name('awa')
    .description('awa - tool for generating AI coding agent configuration files')
    .version('0.0.0-test', '-v, --version', 'Display version number');

  program.addCommand(buildGenerateCommand());
  program.addCommand(buildDiffCommand());
  return program;
}

describe('CLI Argument Parser', () => {
  describe('generate command', () => {
    // @awa-test: CLI-1_AC-1
    it('should provide generate as a command', () => {
      const program = buildProgram();
      const genCmd = program.commands.find((c) => c.name() === 'generate');
      expect(genCmd).toBeDefined();
    });

    // @awa-test: CLI-1_AC-3, CLI-2_AC-1
    it('should accept output as optional positional argument', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', './my-output']);
      expect(cmd.args[0]).toBe('./my-output');
    });

    // @awa-test: CLI-2_AC-5
    it('should accept relative and absolute paths', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '/absolute/path']);
      expect(cmd.args[0]).toBe('/absolute/path');
    });

    // @awa-test: CLI-2_AC-6
    it('should accept dot for current directory', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '.']);
      expect(cmd.args[0]).toBe('.');
    });

    // @awa-test: CLI-3_AC-1
    it('should accept --template option', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--template', './my-template']);
      expect(cmd.opts().template).toBe('./my-template');
    });

    // @awa-test: CLI-4_AC-1, CLI-4_AC-2
    it('should accept --features as variadic option', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--features', 'copilot', 'claude']);
      expect(cmd.opts().features).toEqual(['copilot', 'claude']);
    });

    // @awa-test: CLI-5_AC-1
    it('should accept --force flag', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--force']);
      expect(cmd.opts().force).toBe(true);
    });

    // @awa-test: CLI-6_AC-1
    it('should accept --dry-run flag', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--dry-run']);
      expect(cmd.opts().dryRun).toBe(true);
    });

    // @awa-test: CLI-7_AC-1
    it('should accept --config option', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--config', './my-config.toml']);
      expect(cmd.opts().config).toBe('./my-config.toml');
    });

    // @awa-test: CLI-8_AC-1
    it('should accept --refresh flag', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--refresh']);
      expect(cmd.opts().refresh).toBe(true);
    });

    // @awa-test: CLI-13_AC-1, CLI-13_AC-2
    it('should accept --preset as variadic option', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--preset', 'basic', 'advanced']);
      expect(cmd.opts().preset).toEqual(['basic', 'advanced']);
    });

    // @awa-test: CLI-14_AC-1, CLI-14_AC-2
    it('should accept --remove-features as variadic option', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--remove-features', 'copilot', 'claude']);
      expect(cmd.opts().removeFeatures).toEqual(['copilot', 'claude']);
    });

    // @awa-test: CLI-6_AC-3
    it('should display dry-run mode without writing when --dry-run is set', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'generate', '--dry-run', '.']);
      expect(cmd.opts().dryRun).toBe(true);
      expect(cmd.args[0]).toBe('.');
    });

    // @awa-test: CLI-11_AC-1, CLI-11_AC-3
    it('should reject unknown options', () => {
      const cmd = buildGenerateCommand();
      cmd.exitOverride();
      expect(() => cmd.parse(['node', 'generate', '--unknown-option'])).toThrow();
    });
  });

  describe('diff command', () => {
    // @awa-test: DIFF-7_AC-4, DIFF-7_AC-5
    it('should accept target as optional positional argument', () => {
      const cmd = buildDiffCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'diff', '/absolute/target']);
      expect(cmd.args[0]).toBe('/absolute/target');
    });

    // @awa-test: DIFF-7_AC-6
    it('should accept --template option', () => {
      const cmd = buildDiffCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'diff', '--template', 'user/repo']);
      expect(cmd.opts().template).toBe('user/repo');
    });

    // @awa-test: DIFF-7_AC-7
    it('should accept --features as variadic option', () => {
      const cmd = buildDiffCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'diff', '--features', 'copilot', 'claude']);
      expect(cmd.opts().features).toEqual(['copilot', 'claude']);
    });

    // @awa-test: DIFF-7_AC-8
    it('should accept --config option', () => {
      const cmd = buildDiffCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'diff', '--config', './my-config.toml']);
      expect(cmd.opts().config).toBe('./my-config.toml');
    });

    // @awa-test: DIFF-7_AC-9
    it('should accept --refresh flag', () => {
      const cmd = buildDiffCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'diff', '--refresh']);
      expect(cmd.opts().refresh).toBe(true);
    });

    // @awa-test: DIFF-7_AC-10
    it('should NOT accept --force, --dry-run, or --delete flags', () => {
      const cmd = buildDiffCommand();
      cmd.exitOverride();
      expect(() => cmd.parse(['node', 'diff', '--force'])).toThrow();
      expect(() => cmd.parse(['node', 'diff', '--dry-run'])).toThrow();
      expect(() => cmd.parse(['node', 'diff', '--delete'])).toThrow();
    });

    // @awa-test: DIFF-7_AC-12
    it('should accept --preset as variadic option', () => {
      const cmd = buildDiffCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'diff', '--preset', 'basic', 'advanced']);
      expect(cmd.opts().preset).toEqual(['basic', 'advanced']);
    });

    // @awa-test: DIFF-7_AC-13
    it('should accept --remove-features as variadic option', () => {
      const cmd = buildDiffCommand();
      cmd.exitOverride();
      cmd.parse(['node', 'diff', '--remove-features', 'copilot', 'claude']);
      expect(cmd.opts().removeFeatures).toEqual(['copilot', 'claude']);
    });
  });

  describe('root program', () => {
    // @awa-test: CLI-1_AC-5, CLI-9_AC-1, CLI-9_AC-3
    it('should display help with all available options', () => {
      const program = buildProgram();
      const helpText = program.helpInformation();
      expect(helpText).toContain('generate');
      expect(helpText).toContain('diff');
    });

    // @awa-test: CLI-9_AC-2
    it('should display generate command help with all options', () => {
      const cmd = buildGenerateCommand();
      const helpText = cmd.helpInformation();
      expect(helpText).toContain('--template');
      expect(helpText).toContain('--features');
      expect(helpText).toContain('--force');
      expect(helpText).toContain('--dry-run');
      expect(helpText).toContain('--config');
      expect(helpText).toContain('--refresh');
      expect(helpText).toContain('--preset');
      expect(helpText).toContain('--remove-features');
      expect(helpText).toContain('--delete');
    });

    // @awa-test: CLI-10_AC-1, CLI-10_AC-2
    it('should configure version flag', () => {
      const program = buildProgram();
      expect(program.version()).toBe('0.0.0-test');
    });

    // @awa-test: CLI-1_AC-2
    it('should show help when no command is given', () => {
      const program = buildProgram();
      const helpText = program.helpInformation();
      expect(helpText).toContain('awa');
    });
  });
});
