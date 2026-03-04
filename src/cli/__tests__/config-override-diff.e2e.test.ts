import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { diffCommand } from '../../commands/diff.js';
import { enterTempWorkspace, leaveTempWorkspace, type TestWorkspace } from './test-workspace.js';

describe('CLI/config override diff e2e regression', () => {
  let workspace: TestWorkspace;
  let testDir: string;

  beforeEach(async () => {
    workspace = await enterTempWorkspace('awa-cli-diff-e2e');
    testDir = workspace.dir;
  });

  afterEach(async () => {
    await leaveTempWorkspace(workspace);
  });

  it('honors overlay from .awa.toml when --overlay is omitted', async () => {
    await mkdir(join(testDir, 'template-base'), { recursive: true });
    await mkdir(join(testDir, 'template-overlay'), { recursive: true });
    await mkdir(join(testDir, 'target'), { recursive: true });

    await writeFile(join(testDir, 'template-base', 'agent.md'), 'base\n');
    await writeFile(join(testDir, 'template-overlay', 'agent.md'), 'overlay\n');
    await writeFile(join(testDir, 'target', 'agent.md'), 'overlay\n');

    await writeFile(
      join(testDir, '.awa.toml'),
      [
        'output = "./target"',
        'template = "./template-base"',
        'features = ["copilot"]',
        'overlay = ["./template-overlay"]',
      ].join('\n'),
    );

    const exitCode = await diffCommand({});
    expect(exitCode).toBe(0);
  });

  it('honors list-unknown from .awa.toml when --list-unknown is omitted', async () => {
    await mkdir(join(testDir, 'template-base'), { recursive: true });
    await mkdir(join(testDir, 'target'), { recursive: true });

    await writeFile(join(testDir, 'template-base', 'agent.md'), 'same\n');
    await writeFile(join(testDir, 'target', 'agent.md'), 'same\n');
    await writeFile(join(testDir, 'target', 'extra.md'), 'extra\n');

    await writeFile(
      join(testDir, '.awa.toml'),
      [
        'output = "./target"',
        'template = "./template-base"',
        'features = ["copilot"]',
        'list-unknown = true',
      ].join('\n'),
    );

    const exitCode = await diffCommand({});
    expect(exitCode).toBe(1);
  });
});
