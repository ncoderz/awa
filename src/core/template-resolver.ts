// @awa-component: TPL-TemplateResolver
// @awa-impl: CLI-3_AC-2
// @awa-impl: CLI-3_AC-3
// @awa-impl: CLI-8_AC-2
// @awa-impl: TPL-1_AC-1
// @awa-impl: TPL-1_AC-2
// @awa-impl: TPL-1_AC-3
// @awa-impl: TPL-1_AC-4
// @awa-impl: TPL-2_AC-1
// @awa-impl: TPL-2_AC-2
// @awa-impl: TPL-2_AC-3
// @awa-impl: TPL-2_AC-4
// @awa-impl: TPL-2_AC-5
// @awa-impl: TPL-2_AC-6
// @awa-impl: TPL-3_AC-1
// @awa-impl: TPL-3_AC-2
// @awa-impl: TPL-3_AC-3
// @awa-impl: TPL-3_AC-4
// @awa-impl: TPL-10_AC-1
// @awa-impl: TPL-10_AC-2
// @awa-impl: TPL-10_AC-3

import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import degit from 'degit';
import { type ResolvedTemplate, TemplateError, type TemplateSourceType } from '../types/index.js';
import { ensureDir, getCacheDir, getTemplateDir, pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export class TemplateResolver {
  // @awa-impl: CLI-3_AC-2, TPL-10_AC-1
  async resolve(source: string | null, refresh: boolean): Promise<ResolvedTemplate> {
    // If no source provided, use bundled templates
    if (!source) {
      const bundledPath = join(getTemplateDir(), 'awa');
      return {
        type: 'bundled',
        localPath: bundledPath,
        source: 'bundled',
      };
    }

    const type = this.detectType(source);

    // @awa-impl: TPL-1_AC-1, TPL-1_AC-2, TPL-1_AC-3, TPL-1_AC-4
    if (type === 'local') {
      // Resolve relative/absolute paths
      const localPath = isAbsolute(source) ? source : resolve(process.cwd(), source);

      // Check if path exists
      if (!(await pathExists(localPath))) {
        throw new TemplateError(
          `Template source not found: ${localPath}`,
          'SOURCE_NOT_FOUND',
          source
        );
      }

      // Local templates are not cached
      return {
        type: 'local',
        localPath,
        source,
      };
    }

    // @awa-impl: TPL-2_AC-1 through TPL-2_AC-6, TPL-3_AC-1 through TPL-3_AC-4
    if (type === 'git') {
      const cachePath = this.getCachePath(source);

      // @awa-impl: CLI-8_AC-2, TPL-3_AC-2
      // Check if cached version exists
      const cacheExists = await pathExists(cachePath);

      if (cacheExists && !refresh) {
        // Use cached version
        logger.info(`Using cached template: ${source}`);
        return {
          type: 'git',
          localPath: cachePath,
          source,
        };
      }

      // Fetch from Git
      try {
        // Remove existing cache if refresh
        if (cacheExists && refresh) {
          logger.info(`Refreshing template: ${source}`);
          await rm(cachePath, { recursive: true, force: true });
        } else {
          logger.info(`Fetching template: ${source}`);
        }

        await ensureDir(cachePath);

        // Use degit for shallow fetch
        const emitter = degit(source, { cache: false, force: true });
        await emitter.clone(cachePath);

        return {
          type: 'git',
          localPath: cachePath,
          source,
        };
      } catch (error) {
        throw new TemplateError(
          `Failed to fetch Git template: ${error instanceof Error ? error.message : String(error)}`,
          'FETCH_FAILED',
          source
        );
      }
    }

    throw new TemplateError(
      `Unable to resolve template source: ${source}`,
      'SOURCE_NOT_FOUND',
      source
    );
  }

  // @awa-impl: TPL-2_AC-1 through TPL-2_AC-6
  detectType(source: string): TemplateSourceType {
    // Check for local path indicators
    if (source.startsWith('.') || source.startsWith('/') || source.startsWith('~')) {
      return 'local';
    }

    // Check for Windows absolute paths
    if (/^[a-zA-Z]:/.test(source)) {
      return 'local';
    }

    // All other formats are treated as Git sources:
    // - GitHub shorthand: owner/repo
    // - Prefixed: github:owner/repo, gitlab:owner/repo, bitbucket:owner/repo
    // - HTTPS: https://github.com/owner/repo
    // - SSH: git@github.com:owner/repo
    // - With subdirs: owner/repo/path/to/templates
    // - With refs: owner/repo#branch
    return 'git';
  }

  // @awa-impl: TPL-3_AC-1
  getCachePath(source: string): string {
    // Create a stable cache path based on source hash
    const hash = createHash('sha256').update(source).digest('hex').substring(0, 16);
    const cacheDir = getCacheDir();
    return join(cacheDir, hash);
  }
}

export const templateResolver = new TemplateResolver();
