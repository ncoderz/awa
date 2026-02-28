// @awa-component: CLI-UpdateCheck

import chalk from 'chalk';
import { PACKAGE_INFO } from '../_generated/package_info.js';
import type { Logger } from './logger.js';

export interface UpdateCheckResult {
  current: string;
  latest: string;
  isOutdated: boolean;
  isMajorBump: boolean;
}

/**
 * Compare two semver version strings numerically (major.minor.patch only).
 * Returns a negative number if a < b, 0 if equal, positive if a > b.
 */
export function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map((s) => Number.parseInt(s, 10));
  const partsB = b.split('.').map((s) => Number.parseInt(s, 10));

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Check if a version bump is a major version bump.
 */
export function isMajorVersionBump(current: string, latest: string): boolean {
  const currentMajor = Number.parseInt(current.split('.')[0] ?? '0', 10);
  const latestMajor = Number.parseInt(latest.split('.')[0] ?? '0', 10);
  return latestMajor > currentMajor;
}

/**
 * Fetch the latest version from the npm registry.
 * Returns the update check result or null on any error.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult | null> {
  try {
    const response = await fetch('https://registry.npmjs.org/@ncoderz/awa/latest', {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { version?: string };
    const latest = data.version;
    if (!latest || typeof latest !== 'string') return null;

    const current = PACKAGE_INFO.version;
    const isOutdated = compareSemver(current, latest) < 0;

    return {
      current,
      latest,
      isOutdated,
      isMajorBump: isOutdated && isMajorVersionBump(current, latest),
    };
  } catch {
    return null;
  }
}

/**
 * Print an update warning to the console using the logger.
 */
export function printUpdateWarning(log: Logger, result: UpdateCheckResult): void {
  if (!result.isOutdated) return;

  console.log('');
  if (result.isMajorBump) {
    log.warn(
      chalk.yellow(
        `New major version available: ${result.current} → ${result.latest} (breaking changes)`
      )
    );
    log.warn(chalk.dim('  See https://github.com/ncoderz/awa/releases for details'));
  } else {
    log.warn(chalk.yellow(`Update available: ${result.current} → ${result.latest}`));
  }
  log.warn(chalk.dim('  Run `npm install -g @ncoderz/awa` to update'));
  console.log('');
}
