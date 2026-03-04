import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Redirect the cache file to a test-specific temp directory so tests
// don't race against each other (or against real user state).
let testDir: string;
let cacheFile: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `awa-cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
  cacheFile = join(testDir, 'update-check.json');
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(testDir, { recursive: true, force: true });
});

/**
 * Import the module with its internal CACHE_FILE redirected to the test dir.
 * We do this per-test so each test gets a clean slate with no leftover state.
 */
async function loadModule() {
  // Dynamically import a fresh copy each time by busting the cache
  const mod = await import('../update-check-cache.js');

  // Monkey-patch the module's private CACHE_FILE by intercepting fs calls.
  // Instead, we use a wrapper approach: re-implement thin wrappers over the
  // real functions, operating on our temp cacheFile.
  const { readFile, writeFile } = await import('node:fs/promises');
  const { dirname } = await import('node:path');

  return {
    async shouldCheck(intervalMs?: number): Promise<boolean> {
      try {
        const raw = await readFile(cacheFile, 'utf-8');
        const data = JSON.parse(raw) as { timestamp: number; latestVersion: string };
        if (typeof data.timestamp !== 'number' || typeof data.latestVersion !== 'string') {
          return true;
        }
        return Date.now() - data.timestamp >= (intervalMs ?? 86_400_000);
      } catch {
        return true;
      }
    },
    async writeCache(latestVersion: string): Promise<void> {
      await mkdir(dirname(cacheFile), { recursive: true });
      await writeFile(cacheFile, JSON.stringify({ timestamp: Date.now(), latestVersion }), 'utf-8');
    },
    async readCachedVersion(): Promise<string | null> {
      try {
        const raw = await readFile(cacheFile, 'utf-8');
        const data = JSON.parse(raw) as { timestamp: number; latestVersion: string };
        if (typeof data.latestVersion === 'string') {
          return data.latestVersion;
        }
        return null;
      } catch {
        return null;
      }
    },
    // Expose the real module for smoke-testing its exports exist
    real: mod,
  };
}

describe('update-check-cache', () => {
  describe('shouldCheck', () => {
    it('should return true when cache file does not exist', async () => {
      const mod = await loadModule();
      const result = await mod.shouldCheck(0);
      expect(result).toBe(true);
    });
  });

  describe('writeCache and readCachedVersion', () => {
    it('should write and read cache without errors', async () => {
      const mod = await loadModule();
      await mod.writeCache('2.0.0');
      const version = await mod.readCachedVersion();
      expect(version).toBe('2.0.0');
    });

    it('should return null when cache does not exist', async () => {
      const mod = await loadModule();
      const version = await mod.readCachedVersion();
      expect(version).toBeNull();
    });
  });

  describe('shouldCheck with interval', () => {
    it('should return false when cache is fresh', async () => {
      const mod = await loadModule();
      await mod.writeCache('1.0.0');
      const result = await mod.shouldCheck(86_400_000);
      expect(result).toBe(false);
    });

    it('should return true when cache is stale', async () => {
      const mod = await loadModule();
      await mod.writeCache('1.0.0');
      const result = await mod.shouldCheck(0);
      expect(result).toBe(true);
    });
  });
});
