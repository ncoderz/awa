import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { generateCommand } from '../../commands/generate.js';
import type { RawCliOptions } from '../../types/index.js';
import { cliProvidedOption } from '../option-source.js';
import { enterTempWorkspace, leaveTempWorkspace, type TestWorkspace } from './test-workspace.js';

function buildGenerateCommandForTest(): Command {
  return new Command('generate')
    .argument('[output]', 'Output directory (optional if specified in config)')
    .option('-t, --template <source>', 'Template source (local path or Git repository)')
    .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
    .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
    .option(
      '--remove-features <flag...>',
      'Feature flags to remove (can be specified multiple times)',
    )
    .option('--force', 'Force overwrite existing files without prompting', false)
    .option('--dry-run', 'Preview changes without modifying files', false)
    .option(
      '--delete',
      'Enable deletion of files listed in the delete list (default: warn only)',
      false,
    )
    .option('-c, --config <path>', 'Path to configuration file')
    .option('--refresh', 'Force refresh of cached Git templates', false)
    .option('--all-targets', 'Process all named targets from config', false)
    .option('--target <name>', 'Process a specific named target from config')
    .option(
      '--overlay <path...>',
      'Overlay directory paths applied over base template (repeatable)',
    )
    .option('--json', 'Output results as JSON (implies --dry-run)', false)
    .option('--summary', 'Output compact one-line summary', false)
    .action(async (output: string | undefined, options, command: Command) => {
      const allTargets = cliProvidedOption<boolean>(command, options, 'allTargets');
      const cliOptions: RawCliOptions = {
        output,
        template: cliProvidedOption<string>(command, options, 'template'),
        features: cliProvidedOption<string[]>(command, options, 'features'),
        preset: cliProvidedOption<string[]>(command, options, 'preset'),
        removeFeatures: cliProvidedOption<string[]>(command, options, 'removeFeatures'),
        force: cliProvidedOption<boolean>(command, options, 'force'),
        dryRun: cliProvidedOption<boolean>(command, options, 'dryRun'),
        delete: cliProvidedOption<boolean>(command, options, 'delete'),
        config: cliProvidedOption<string>(command, options, 'config'),
        refresh: cliProvidedOption<boolean>(command, options, 'refresh'),
        all: allTargets,
        allTargets,
        target: cliProvidedOption<string>(command, options, 'target'),
        overlay: cliProvidedOption<string[]>(command, options, 'overlay'),
        json: cliProvidedOption<boolean>(command, options, 'json'),
        summary: cliProvidedOption<boolean>(command, options, 'summary'),
      };

      await generateCommand(cliOptions);
    });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('CLI/config override generate e2e regression', () => {
  let workspace: TestWorkspace;
  let testDir: string;

  beforeEach(async () => {
    workspace = await enterTempWorkspace('awa-cli-generate-e2e');
    testDir = workspace.dir;
  });

  afterEach(async () => {
    await leaveTempWorkspace(workspace);
  });

  it('honors dry-run from .awa.toml when --dry-run is omitted', async () => {
    await mkdir(join(testDir, 'template'), { recursive: true });
    await writeFile(join(testDir, 'template', 'agent.md'), 'hello from template\n');

    await writeFile(
      join(testDir, '.awa.toml'),
      [
        'output = "./out"',
        'template = "./template"',
        'features = ["copilot"]',
        'dry-run = true',
      ].join('\n'),
    );

    const cmd = buildGenerateCommandForTest();
    await cmd.parseAsync([], { from: 'user' });

    const outFile = join(testDir, 'out', 'agent.md');
    expect(await fileExists(outFile)).toBe(false);
  });

  it('honors overlay from .awa.toml when --overlay is omitted', async () => {
    await mkdir(join(testDir, 'template-base'), { recursive: true });
    await mkdir(join(testDir, 'template-overlay'), { recursive: true });

    await writeFile(join(testDir, 'template-base', 'agent.md'), 'base\n');
    await writeFile(join(testDir, 'template-overlay', 'agent.md'), 'overlay\n');

    await writeFile(
      join(testDir, '.awa.toml'),
      [
        'output = "./out"',
        'template = "./template-base"',
        'features = ["copilot"]',
        'overlay = ["./template-overlay"]',
      ].join('\n'),
    );

    const cmd = buildGenerateCommandForTest();
    await cmd.parseAsync([], { from: 'user' });

    const output = await readFile(join(testDir, 'out', 'agent.md'), 'utf8');
    expect(output).toContain('overlay');
  });
});
