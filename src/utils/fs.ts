// @awa-component: GEN-FileSystem

import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, 'utf-8');
}

export async function readBinaryFile(path: string): Promise<Buffer> {
  return readFile(path);
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, 'utf-8');
}

export async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip directories starting with underscore
      if (entry.name.startsWith('_')) {
        continue;
      }
      yield* walkDirectory(fullPath);
    } else if (entry.isFile()) {
      // Skip files starting with underscore
      if (entry.name.startsWith('_')) {
        continue;
      }
      yield fullPath;
    }
  }
}

export function getCacheDir(): string {
  return join(homedir(), '.cache', 'awa', 'templates');
}

export function getTemplateDir(): string {
  // In built dist, we need to go up from dist/index.js to project root
  // In development, we're in src/utils/fs.ts
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);

  // Check if we're in dist/ or src/
  if (currentDir.includes('/dist')) {
    // In dist: go up one level to project root
    return join(dirname(currentDir), 'templates');
  }

  // In src: go up two levels to project root
  return join(currentDir, '..', '..', 'templates');
}

export async function rmDir(dirPath: string): Promise<void> {
  await rm(dirPath, { recursive: true, force: true });
}

export async function deleteFile(filePath: string): Promise<void> {
  await rm(filePath, { force: true });
}
