// @awa-component: JSON-JsonSerializer
// @awa-impl: JSON-1_AC-1
// @awa-impl: JSON-2_AC-1
// @awa-impl: JSON-3_AC-1
// @awa-impl: JSON-4_AC-1
// @awa-impl: JSON-5_AC-1
// @awa-impl: JSON-8_AC-1

import type {
  DiffFileJSON,
  DiffJSON,
  DiffResult,
  GenerationActionJSON,
  GenerationJSON,
  GenerationResult,
} from '../types/index.js';

// @awa-impl: JSON-1_AC-1, JSON-3_AC-1
export function serializeGenerationResult(result: GenerationResult): GenerationJSON {
  const actions: GenerationActionJSON[] = result.actions.map((action) => ({
    type: action.type,
    path: action.outputPath,
  }));

  return {
    actions,
    counts: {
      created: result.created,
      overwritten: result.overwritten,
      skipped: result.skipped,
      deleted: result.deleted,
    },
  };
}

// @awa-impl: JSON-2_AC-1, JSON-4_AC-1
export function serializeDiffResult(result: DiffResult): DiffJSON {
  const diffs: DiffFileJSON[] = result.files.map((file) => {
    const entry: DiffFileJSON = {
      path: file.relativePath,
      status: file.status,
    };
    if (file.unifiedDiff) {
      entry.diff = file.unifiedDiff;
    }
    return entry;
  });

  return {
    diffs,
    counts: {
      changed: result.modified,
      new: result.newFiles,
      matching: result.identical,
      deleted: result.deleteListed,
    },
  };
}

// @awa-impl: JSON-5_AC-1
export function formatGenerationSummary(result: GenerationResult): string {
  return `created: ${result.created}, overwritten: ${result.overwritten}, skipped: ${result.skipped}, deleted: ${result.deleted}`;
}

// @awa-impl: JSON-5_AC-1
export function formatDiffSummary(result: DiffResult): string {
  return `changed: ${result.modified}, new: ${result.newFiles}, matching: ${result.identical}, deleted: ${result.deleteListed}`;
}

// @awa-impl: JSON-8_AC-1
export function writeJsonOutput(data: GenerationJSON | DiffJSON): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}
