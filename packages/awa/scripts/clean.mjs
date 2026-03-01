#!/usr/bin/env node
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pathsToRemove = ['dist', 'coverage', path.join('node_modules', '.cache', 'tsbuildinfo')];

async function removePath(target) {
  const absolutePath = path.resolve(projectRoot, target);
  try {
    await rm(absolutePath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to remove ${absolutePath}:`, error);
    throw error;
  }
}

async function main() {
  await Promise.all(pathsToRemove.map(removePath));
}

main().catch((error) => {
  console.error('Clean script failed.', error);
  process.exitCode = 1;
});
