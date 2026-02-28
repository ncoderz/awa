// @awa-component: OVL-OverlayResolver
// @awa-component: OVL-MergedTemplateView
// @awa-impl: OVL-1_AC-1
// @awa-impl: OVL-2_AC-1
// @awa-impl: OVL-3_AC-1
// @awa-impl: OVL-4_AC-1
// @awa-impl: OVL-5_AC-1
// @awa-impl: OVL-6_AC-1

import { cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureDir } from '../utils/fs.js';
import { templateResolver } from './template-resolver.js';

/**
 * Resolve each overlay source string to a local directory path.
 * Delegates to TemplateResolver so local paths and Git sources are both handled.
 *
 * @awa-impl: OVL-1_AC-1, OVL-6_AC-1
 */
export async function resolveOverlays(overlays: string[], refresh: boolean): Promise<string[]> {
  const dirs: string[] = [];
  for (const source of overlays) {
    const resolved = await templateResolver.resolve(source, refresh);
    dirs.push(resolved.localPath);
  }
  return dirs;
}

/**
 * Build a temporary merged directory by copying baseDir then applying each
 * overlay in order. Later overlay files overwrite earlier ones at the same
 * relative path; base-only files are left intact; overlay-only files are added.
 *
 * Caller is responsible for cleaning up the returned temp directory.
 *
 * @awa-impl: OVL-2_AC-1, OVL-3_AC-1, OVL-4_AC-1, OVL-5_AC-1
 */
export async function buildMergedDir(baseDir: string, overlayDirs: string[]): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const tempPath = join(tmpdir(), `awa-overlay-${timestamp}-${random}`);

  await ensureDir(tempPath);

  // Copy base template files into the temp directory
  await cp(baseDir, tempPath, { recursive: true });

  // Apply overlays in order — later overlays win (force: true is the default for fs.cp)
  for (const overlayDir of overlayDirs) {
    await cp(overlayDir, tempPath, { recursive: true });
  }

  return tempPath;
}
