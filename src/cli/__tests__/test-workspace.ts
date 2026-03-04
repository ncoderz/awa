import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TestWorkspace {
  dir: string;
  originalCwd: string;
}

export async function enterTempWorkspace(prefix: string): Promise<TestWorkspace> {
  const dir = join(tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(dir, { recursive: true });

  const originalCwd = process.cwd();
  process.chdir(dir);

  return { dir, originalCwd };
}

export async function leaveTempWorkspace(workspace: TestWorkspace): Promise<void> {
  process.chdir(workspace.originalCwd);
  await rm(workspace.dir, { recursive: true, force: true });
}
