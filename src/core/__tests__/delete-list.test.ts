// @awa-component: GEN-DeleteList

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDeleteList, parseDeleteList, resolveDeleteList } from '../delete-list.js';

describe('parseDeleteList', () => {
  it('should parse paths from content', () => {
    const content = 'file1.md\nfile2.md\n';
    expect(parseDeleteList(content)).toEqual([{ path: 'file1.md' }, { path: 'file2.md' }]);
  });

  it('should ignore blank lines', () => {
    const content = 'file1.md\n\n\nfile2.md\n';
    expect(parseDeleteList(content)).toEqual([{ path: 'file1.md' }, { path: 'file2.md' }]);
  });

  it('should ignore plain comment lines', () => {
    const content = '# This is a comment\nfile1.md\n# Another comment\nfile2.md\n';
    expect(parseDeleteList(content)).toEqual([{ path: 'file1.md' }, { path: 'file2.md' }]);
  });

  it('should trim whitespace from lines', () => {
    const content = '  file1.md  \n\tfile2.md\t\n';
    expect(parseDeleteList(content)).toEqual([{ path: 'file1.md' }, { path: 'file2.md' }]);
  });

  it('should return empty array for empty content', () => {
    expect(parseDeleteList('')).toEqual([]);
  });

  it('should return empty array for comments-only content', () => {
    const content = '# comment\n# another\n';
    expect(parseDeleteList(content)).toEqual([]);
  });

  it('should handle paths with directories', () => {
    const content = '.github/agents/old.md\nsome/deep/path/file.txt\n';
    expect(parseDeleteList(content)).toEqual([
      { path: '.github/agents/old.md' },
      { path: 'some/deep/path/file.txt' },
    ]);
  });

  it('should attach single feature to paths under @feature section', () => {
    const content = '# @feature copilot\nfile1.md\nfile2.md\n';
    expect(parseDeleteList(content)).toEqual([
      { path: 'file1.md', features: ['copilot'] },
      { path: 'file2.md', features: ['copilot'] },
    ]);
  });

  it('should attach multiple features to paths under @feature section', () => {
    const content = '# @feature roo codex agy\nAGENTS.md\n';
    expect(parseDeleteList(content)).toEqual([
      { path: 'AGENTS.md', features: ['roo', 'codex', 'agy'] },
    ]);
  });

  it('should reset feature section after a plain comment', () => {
    const content = '# @feature claude\nCLAUDE.md\n# plain comment resets\nlegacy.md\n';
    expect(parseDeleteList(content)).toEqual([
      { path: 'CLAUDE.md', features: ['claude'] },
      { path: 'legacy.md' },
    ]);
  });

  it('should switch feature section at each @feature header', () => {
    const content = '# @feature copilot\na.md\n# @feature claude\nb.md\n';
    expect(parseDeleteList(content)).toEqual([
      { path: 'a.md', features: ['copilot'] },
      { path: 'b.md', features: ['claude'] },
    ]);
  });

  it('should treat paths before any @feature header as always-delete', () => {
    const content = 'legacy.md\n# @feature copilot\nguarded.md\n';
    expect(parseDeleteList(content)).toEqual([
      { path: 'legacy.md' },
      { path: 'guarded.md', features: ['copilot'] },
    ]);
  });
});

describe('resolveDeleteList', () => {
  it('should include entries without features (legacy always-delete)', () => {
    const entries = [{ path: 'old.md' }];
    expect(resolveDeleteList(entries, [])).toEqual(['old.md']);
    expect(resolveDeleteList(entries, ['copilot'])).toEqual(['old.md']);
  });

  it('should exclude feature-gated entry when that feature is active', () => {
    const entries = [{ path: 'CLAUDE.md', features: ['claude'] }];
    expect(resolveDeleteList(entries, ['claude'])).toEqual([]);
  });

  it('should include feature-gated entry when that feature is not active', () => {
    const entries = [{ path: 'CLAUDE.md', features: ['claude'] }];
    expect(resolveDeleteList(entries, ['copilot'])).toEqual(['CLAUDE.md']);
    expect(resolveDeleteList(entries, [])).toEqual(['CLAUDE.md']);
  });

  it('should exclude entry when any of its features are active (multi-feature)', () => {
    const entries = [{ path: 'AGENTS.md', features: ['roo', 'codex', 'agy'] }];
    expect(resolveDeleteList(entries, ['roo'])).toEqual([]);
    expect(resolveDeleteList(entries, ['codex'])).toEqual([]);
    expect(resolveDeleteList(entries, ['agy'])).toEqual([]);
    expect(resolveDeleteList(entries, ['roo', 'codex'])).toEqual([]);
  });

  it('should include multi-feature entry when none of its features are active', () => {
    const entries = [{ path: 'AGENTS.md', features: ['roo', 'codex', 'agy'] }];
    expect(resolveDeleteList(entries, ['copilot', 'claude'])).toEqual(['AGENTS.md']);
    expect(resolveDeleteList(entries, [])).toEqual(['AGENTS.md']);
  });

  it('should handle mixed legacy and feature-gated entries', () => {
    const entries = [
      { path: 'legacy.md' },
      { path: 'copilot.md', features: ['copilot'] },
      { path: 'claude.md', features: ['claude'] },
    ];
    expect(resolveDeleteList(entries, ['copilot'])).toEqual(['legacy.md', 'claude.md']);
    expect(resolveDeleteList(entries, ['claude'])).toEqual(['legacy.md', 'copilot.md']);
    expect(resolveDeleteList(entries, [])).toEqual(['legacy.md', 'copilot.md', 'claude.md']);
  });
});

describe('loadDeleteList', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-delete-list-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return empty array when _delete.txt does not exist', async () => {
    const result = await loadDeleteList(testDir);
    expect(result).toEqual([]);
  });

  it('should load and parse _delete.txt from template directory', async () => {
    await writeFile(
      join(testDir, '_delete.txt'),
      '# Removed files\nold-file.md\n.github/agents/deprecated.md\n'
    );

    const result = await loadDeleteList(testDir);
    expect(result).toEqual([{ path: 'old-file.md' }, { path: '.github/agents/deprecated.md' }]);
  });

  it('should load and parse feature-gated entries', async () => {
    await writeFile(
      join(testDir, '_delete.txt'),
      '# @feature claude\nCLAUDE.md\n.claude/agents/awa.md\n'
    );

    const result = await loadDeleteList(testDir);
    expect(result).toEqual([
      { path: 'CLAUDE.md', features: ['claude'] },
      { path: '.claude/agents/awa.md', features: ['claude'] },
    ]);
  });
});
