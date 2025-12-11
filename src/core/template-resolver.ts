// @zen-component: TemplateResolver
// @zen-impl: CLI-3 AC-3.2
// @zen-impl: CLI-3 AC-3.3
// @zen-impl: CLI-8 AC-8.2
// @zen-impl: TPL-1 AC-1.1
// @zen-impl: TPL-1 AC-1.2
// @zen-impl: TPL-1 AC-1.3
// @zen-impl: TPL-1 AC-1.4
// @zen-impl: TPL-2 AC-2.1
// @zen-impl: TPL-2 AC-2.2
// @zen-impl: TPL-2 AC-2.3
// @zen-impl: TPL-2 AC-2.4
// @zen-impl: TPL-2 AC-2.5
// @zen-impl: TPL-2 AC-2.6
// @zen-impl: TPL-3 AC-3.1
// @zen-impl: TPL-3 AC-3.2
// @zen-impl: TPL-3 AC-3.3
// @zen-impl: TPL-3 AC-3.4
// @zen-impl: TPL-10 AC-10.1
// @zen-impl: TPL-10 AC-10.2
// @zen-impl: TPL-10 AC-10.3

import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import degit from "degit";
import { type ResolvedTemplate, TemplateError, type TemplateSourceType } from "../types/index.js";
import { ensureDir, getCacheDir, getTemplateDir, pathExists } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

export class TemplateResolver {
  // @zen-impl: CLI-3 AC-3.2, TPL-10 AC-10.1
  async resolve(source: string | null, refresh: boolean): Promise<ResolvedTemplate> {
    // If no source provided, use bundled templates
    if (!source) {
      const bundledPath = getTemplateDir();
      return {
        type: "bundled",
        localPath: bundledPath,
        source: "bundled",
      };
    }

    const type = this.detectType(source);

    // @zen-impl: TPL-1 AC-1.1, TPL-1 AC-1.2, TPL-1 AC-1.3, TPL-1 AC-1.4
    if (type === "local") {
      // Resolve relative/absolute paths
      const localPath = isAbsolute(source) ? source : resolve(process.cwd(), source);

      // Check if path exists
      if (!(await pathExists(localPath))) {
        throw new TemplateError(`Template source not found: ${localPath}`, "SOURCE_NOT_FOUND", source);
      }

      // Local templates are not cached
      return {
        type: "local",
        localPath,
        source,
      };
    }

    // @zen-impl: TPL-2 AC-2.1 through TPL-2 AC-2.6, TPL-3 AC-3.1 through TPL-3 AC-3.4
    if (type === "git") {
      const cachePath = this.getCachePath(source);

      // @zen-impl: CLI-8 AC-8.2, TPL-3 AC-3.2
      // Check if cached version exists
      const cacheExists = await pathExists(cachePath);

      if (cacheExists && !refresh) {
        // Use cached version
        logger.info(`Using cached template: ${source}`);
        return {
          type: "git",
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
          type: "git",
          localPath: cachePath,
          source,
        };
      } catch (error) {
        throw new TemplateError(`Failed to fetch Git template: ${error instanceof Error ? error.message : String(error)}`, "FETCH_FAILED", source);
      }
    }

    throw new TemplateError(`Unable to resolve template source: ${source}`, "SOURCE_NOT_FOUND", source);
  }

  // @zen-impl: TPL-2 AC-2.1 through TPL-2 AC-2.6
  detectType(source: string): TemplateSourceType {
    // Check for local path indicators
    if (source.startsWith(".") || source.startsWith("/") || source.startsWith("~")) {
      return "local";
    }

    // Check for Windows absolute paths
    if (/^[a-zA-Z]:/.test(source)) {
      return "local";
    }

    // All other formats are treated as Git sources:
    // - GitHub shorthand: owner/repo
    // - Prefixed: github:owner/repo, gitlab:owner/repo, bitbucket:owner/repo
    // - HTTPS: https://github.com/owner/repo
    // - SSH: git@github.com:owner/repo
    // - With subdirs: owner/repo/path/to/templates
    // - With refs: owner/repo#branch
    return "git";
  }

  // @zen-impl: TPL-3 AC-3.1
  getCachePath(source: string): string {
    // Create a stable cache path based on source hash
    const hash = createHash("sha256").update(source).digest("hex").substring(0, 16);
    const cacheDir = getCacheDir();
    return join(cacheDir, hash);
  }
}

export const templateResolver = new TemplateResolver();
