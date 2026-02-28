// @awa-component: OVL-OverlayResolver
// @awa-component: OVL-MergedTemplateView
// @awa-test: OVL_P-1
// @awa-test: OVL_P-2
// @awa-test: OVL_P-3

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock templateResolver before importing overlay module
vi.mock('../template-resolver.js', () => ({
  templateResolver: {
    resolve: vi.fn(),
  },
}));

import { buildMergedDir, resolveOverlays } from '../overlay.js';
import { templateResolver } from '../template-resolver.js';

describe('overlay', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `awa-overlay-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    await mkdir(testDir, { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // resolveOverlays
  // ---------------------------------------------------------------------------

  describe('resolveOverlays', () => {
    // @awa-test: OVL-1_AC-1
    it('resolves a local overlay path via templateResolver', async () => {
      const overlayDir = join(testDir, 'overlay');
      await mkdir(overlayDir, { recursive: true });

      vi.mocked(templateResolver.resolve).mockResolvedValue({
        type: 'local',
        localPath: overlayDir,
        source: overlayDir,
      });

      const result = await resolveOverlays([overlayDir], false);

      expect(result).toEqual([overlayDir]);
      expect(templateResolver.resolve).toHaveBeenCalledWith(overlayDir, false);
    });

    // @awa-test: OVL-6_AC-1
    it('resolves a git overlay source via templateResolver', async () => {
      const cachedDir = join(testDir, 'cached-overlay');
      await mkdir(cachedDir, { recursive: true });

      vi.mocked(templateResolver.resolve).mockResolvedValue({
        type: 'git',
        localPath: cachedDir,
        source: 'owner/repo',
      });

      const result = await resolveOverlays(['owner/repo'], false);

      expect(result).toEqual([cachedDir]);
      expect(templateResolver.resolve).toHaveBeenCalledWith('owner/repo', false);
    });

    it('resolves multiple overlay sources in order', async () => {
      const dir1 = join(testDir, 'ov1');
      const dir2 = join(testDir, 'ov2');
      await mkdir(dir1, { recursive: true });
      await mkdir(dir2, { recursive: true });

      vi.mocked(templateResolver.resolve)
        .mockResolvedValueOnce({ type: 'local', localPath: dir1, source: dir1 })
        .mockResolvedValueOnce({ type: 'local', localPath: dir2, source: dir2 });

      const result = await resolveOverlays([dir1, dir2], true);

      expect(result).toEqual([dir1, dir2]);
      expect(templateResolver.resolve).toHaveBeenCalledTimes(2);
      expect(templateResolver.resolve).toHaveBeenNthCalledWith(1, dir1, true);
      expect(templateResolver.resolve).toHaveBeenNthCalledWith(2, dir2, true);
    });

    it('returns empty array when no overlays provided', async () => {
      const result = await resolveOverlays([], false);
      expect(result).toEqual([]);
      expect(templateResolver.resolve).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // buildMergedDir
  // ---------------------------------------------------------------------------

  describe('buildMergedDir', () => {
    let baseDir: string;
    let mergedDir: string | null;

    beforeEach(async () => {
      baseDir = join(testDir, 'base');
      await mkdir(baseDir, { recursive: true });
      mergedDir = null;
    });

    afterEach(async () => {
      if (mergedDir) {
        await rm(mergedDir, { recursive: true, force: true });
        mergedDir = null;
      }
    });

    // @awa-test: OVL_P-1
    // @awa-test: OVL-2_AC-1
    it('overlay file replaces base file at same relative path', async () => {
      // Base has file.txt with "base content"
      await writeFile(join(baseDir, 'file.txt'), 'base content');

      // Overlay has file.txt with "overlay content"
      const overlayDir = join(testDir, 'overlay');
      await mkdir(overlayDir, { recursive: true });
      await writeFile(join(overlayDir, 'file.txt'), 'overlay content');

      mergedDir = await buildMergedDir(baseDir, [overlayDir]);

      const content = await readFile(join(mergedDir, 'file.txt'), 'utf-8');
      expect(content).toBe('overlay content');
    });

    // @awa-test: OVL_P-2
    // @awa-test: OVL-3_AC-1
    it('base-only files pass through unchanged when not in overlay', async () => {
      // Base has two files
      await writeFile(join(baseDir, 'base-only.txt'), 'base only content');
      await writeFile(join(baseDir, 'shared.txt'), 'base shared');

      // Overlay only has shared.txt
      const overlayDir = join(testDir, 'overlay');
      await mkdir(overlayDir, { recursive: true });
      await writeFile(join(overlayDir, 'shared.txt'), 'overlay shared');

      mergedDir = await buildMergedDir(baseDir, [overlayDir]);

      const baseOnly = await readFile(join(mergedDir, 'base-only.txt'), 'utf-8');
      expect(baseOnly).toBe('base only content');
    });

    // @awa-test: OVL-4_AC-1
    it('overlay-only files are added to merged output', async () => {
      // Base has base.txt
      await writeFile(join(baseDir, 'base.txt'), 'base content');

      // Overlay has new-file.txt that doesn't exist in base
      const overlayDir = join(testDir, 'overlay');
      await mkdir(overlayDir, { recursive: true });
      await writeFile(join(overlayDir, 'new-file.txt'), 'new overlay file');

      mergedDir = await buildMergedDir(baseDir, [overlayDir]);

      const newFile = await readFile(join(mergedDir, 'new-file.txt'), 'utf-8');
      expect(newFile).toBe('new overlay file');

      // Base file is also present
      const baseFile = await readFile(join(mergedDir, 'base.txt'), 'utf-8');
      expect(baseFile).toBe('base content');
    });

    // @awa-test: OVL_P-3
    // @awa-test: OVL-5_AC-1
    it('last overlay wins when multiple overlays contain the same file', async () => {
      await writeFile(join(baseDir, 'file.txt'), 'base');

      const overlay1 = join(testDir, 'ov1');
      const overlay2 = join(testDir, 'ov2');
      await mkdir(overlay1, { recursive: true });
      await mkdir(overlay2, { recursive: true });
      await writeFile(join(overlay1, 'file.txt'), 'overlay1');
      await writeFile(join(overlay2, 'file.txt'), 'overlay2');

      mergedDir = await buildMergedDir(baseDir, [overlay1, overlay2]);

      const content = await readFile(join(mergedDir, 'file.txt'), 'utf-8');
      expect(content).toBe('overlay2');
    });

    it('returns a path to a new temp directory', async () => {
      await writeFile(join(baseDir, 'a.txt'), 'a');

      mergedDir = await buildMergedDir(baseDir, []);

      expect(mergedDir).toContain('awa-overlay-');
      const content = await readFile(join(mergedDir, 'a.txt'), 'utf-8');
      expect(content).toBe('a');
    });

    it('copies subdirectory structure from base', async () => {
      const subDir = join(baseDir, 'subdir');
      await mkdir(subDir, { recursive: true });
      await writeFile(join(subDir, 'nested.txt'), 'nested content');

      mergedDir = await buildMergedDir(baseDir, []);

      const content = await readFile(join(mergedDir, 'subdir', 'nested.txt'), 'utf-8');
      expect(content).toBe('nested content');
    });

    it('overlay files in subdirectories replace base subdirectory files', async () => {
      const subDir = join(baseDir, 'subdir');
      await mkdir(subDir, { recursive: true });
      await writeFile(join(subDir, 'nested.txt'), 'base nested');

      const overlayDir = join(testDir, 'overlay');
      const overlaySubDir = join(overlayDir, 'subdir');
      await mkdir(overlaySubDir, { recursive: true });
      await writeFile(join(overlaySubDir, 'nested.txt'), 'overlay nested');

      mergedDir = await buildMergedDir(baseDir, [overlayDir]);

      const content = await readFile(join(mergedDir, 'subdir', 'nested.txt'), 'utf-8');
      expect(content).toBe('overlay nested');
    });

    it('copies _ prefixed files (partials) so template engine can use them', async () => {
      const partialsDir = join(baseDir, '_partials');
      await mkdir(partialsDir, { recursive: true });
      await writeFile(join(partialsDir, '_header.md'), 'base header partial');

      const overlayDir = join(testDir, 'overlay');
      const overlayPartialsDir = join(overlayDir, '_partials');
      await mkdir(overlayPartialsDir, { recursive: true });
      await writeFile(join(overlayPartialsDir, '_header.md'), 'overlay header partial');

      mergedDir = await buildMergedDir(baseDir, [overlayDir]);

      const content = await readFile(join(mergedDir, '_partials', '_header.md'), 'utf-8');
      expect(content).toBe('overlay header partial');
    });
  });
});
