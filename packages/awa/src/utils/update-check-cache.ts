import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const CACHE_DIR = join(homedir(), '.cache', 'awa');
const CACHE_FILE = join(CACHE_DIR, 'update-check.json');
const DEFAULT_INTERVAL_MS = 86_400_000; // 1 day

interface CacheData {
  timestamp: number;
  latestVersion: string;
}

/**
 * Determine whether a new update check should be performed.
 * Returns true if the cache is missing, corrupt, or stale.
 */
export async function shouldCheck(intervalMs: number = DEFAULT_INTERVAL_MS): Promise<boolean> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8');
    const data = JSON.parse(raw) as CacheData;

    if (typeof data.timestamp !== 'number' || typeof data.latestVersion !== 'string') {
      return true;
    }

    return Date.now() - data.timestamp >= intervalMs;
  } catch {
    return true;
  }
}

/**
 * Write the latest version and current timestamp to the cache file.
 */
export async function writeCache(latestVersion: string): Promise<void> {
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });

    const data: CacheData = {
      timestamp: Date.now(),
      latestVersion,
    };

    await writeFile(CACHE_FILE, JSON.stringify(data), 'utf-8');
  } catch {
    // Silently ignore write failures
  }
}

/**
 * Read the cached latest version. Returns null if cache is missing or corrupt.
 */
export async function readCachedVersion(): Promise<string | null> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8');
    const data = JSON.parse(raw) as CacheData;
    if (typeof data.latestVersion === 'string') {
      return data.latestVersion;
    }
    return null;
  } catch {
    return null;
  }
}
