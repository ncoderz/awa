// @awa-component: DISC-FeatureScanner
// @awa-impl: DISC-1_AC-1
// @awa-impl: DISC-2_AC-1
// @awa-impl: DISC-3_AC-1

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

/** A single feature flag discovered in a template. */
export interface DiscoveredFeature {
  /** The flag name (e.g. "copilot"). */
  name: string;
  /** Relative paths of template files that reference this flag. */
  files: string[];
}

/** Result of scanning a template directory for feature flags. */
export interface ScanResult {
  /** All discovered feature flags, sorted by name. */
  features: DiscoveredFeature[];
  /** Total number of template files scanned. */
  filesScanned: number;
}

// Matches: it.features.includes('name') or it.features.includes("name")
// Also matches: it.features.indexOf('name') or it.features.indexOf("name")
const FEATURE_PATTERN = /it\.features\.(?:includes|indexOf)\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * Recursively walk a directory yielding all file paths (including those
 * starting with underscore, since partials may reference feature flags).
 */
async function* walkAllFiles(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkAllFiles(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

export class FeatureScanner {
  // @awa-impl: DISC-1_AC-1, DISC-2_AC-1
  /** Extract feature flag names from a single file's content. */
  extractFlags(content: string): string[] {
    const flags = new Set<string>();
    for (const match of content.matchAll(FEATURE_PATTERN)) {
      if (match[1]) {
        flags.add(match[1]);
      }
    }
    return [...flags];
  }

  // @awa-impl: DISC-1_AC-1, DISC-2_AC-1, DISC-3_AC-1
  /** Scan a template directory and return all discovered feature flags. */
  async scan(templatePath: string): Promise<ScanResult> {
    const flagToFiles = new Map<string, Set<string>>();
    let filesScanned = 0;

    for await (const filePath of walkAllFiles(templatePath)) {
      filesScanned++;
      try {
        const content = await readFile(filePath, 'utf-8');
        const flags = this.extractFlags(content);
        const relPath = relative(templatePath, filePath);
        for (const flag of flags) {
          const existing = flagToFiles.get(flag);
          if (existing) {
            existing.add(relPath);
          } else {
            flagToFiles.set(flag, new Set([relPath]));
          }
        }
      } catch {
        // Skip binary files or files that can't be read as UTF-8
      }
    }

    const features: DiscoveredFeature[] = [...flagToFiles.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, files]) => ({
        name,
        files: [...files].sort(),
      }));

    return { features, filesScanned };
  }
}

export const featureScanner = new FeatureScanner();
