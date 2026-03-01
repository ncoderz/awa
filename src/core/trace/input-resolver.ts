// @awa-component: TRC-InputResolver
// @awa-impl: TRC-2_AC-1, TRC-2_AC-2, TRC-2_AC-3

import { readFile } from 'node:fs/promises';
import type { TraceIndex } from './types.js';

/** Result of resolving input to a list of trace IDs. */
export interface InputResolution {
  readonly ids: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Resolve direct ID arguments: validate each ID exists in the index.
 * Returns the IDs that exist and warnings for those that don't.
 */
export function resolveIds(ids: readonly string[], index: TraceIndex): InputResolution {
  const resolved: string[] = [];
  const warnings: string[] = [];

  for (const id of ids) {
    if (index.allIds.has(id)) {
      resolved.push(id);
    } else {
      warnings.push(`ID '${id}' not found in any spec or code`);
    }
  }

  return { ids: resolved, warnings };
}

/**
 * Resolve IDs from a task file by scanning for IMPLEMENTS: and TESTS: lines.
 */
export async function resolveTaskFile(
  taskPath: string,
  index: TraceIndex
): Promise<InputResolution> {
  let content: string;
  try {
    content = await readFile(taskPath, 'utf-8');
  } catch {
    return { ids: [], warnings: [`Task file not found: ${taskPath}`] };
  }

  const ids = new Set<string>();
  const warnings: string[] = [];

  const lines = content.split('\n');
  const idRegex = /[A-Z][A-Z0-9]*-\d+(?:\.\d+)?(?:_AC-\d+)?|[A-Z][A-Z0-9]*_P-\d+/g;

  for (const line of lines) {
    // Look for IMPLEMENTS: and TESTS: lines
    if (/^\s*IMPLEMENTS:/.test(line) || /^\s*TESTS:/.test(line)) {
      let match = idRegex.exec(line);
      while (match !== null) {
        ids.add(match[0]);
        match = idRegex.exec(line);
      }
    }
  }

  // Also extract IDs from the Requirements Traceability section
  // Format: - {AC-ID} → {Task} ({Test}) or - {Property-ID} → {Test}
  // Only extract the first ID on each line (the AC/property before →), skip task refs
  const traceLineRegex = /^- ([A-Z][A-Z0-9]*(?:-\d+(?:\.\d+)?(?:_AC-\d+)?|_P-\d+))/;
  let inTraceSection = false;
  for (const line of lines) {
    if (/^## Requirements Traceability/.test(line)) {
      inTraceSection = true;
      continue;
    }
    if (inTraceSection && /^## /.test(line)) {
      inTraceSection = false;
      continue;
    }
    if (inTraceSection) {
      const traceMatch = traceLineRegex.exec(line);
      if (traceMatch?.[1]) {
        ids.add(traceMatch[1]);
      }
    }
  }

  // Validate resolved IDs
  const resolved: string[] = [];
  for (const id of ids) {
    if (index.allIds.has(id)) {
      resolved.push(id);
    } else {
      warnings.push(`ID '${id}' from task file not found in specs`);
    }
  }

  if (resolved.length === 0 && warnings.length === 0) {
    warnings.push(`No traceability IDs found in task file: ${taskPath}`);
  }

  return { ids: resolved, warnings };
}

/**
 * Resolve IDs from a source file by scanning for @awa-* markers.
 */
export async function resolveSourceFile(
  filePath: string,
  index: TraceIndex
): Promise<InputResolution> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return { ids: [], warnings: [`Source file not found: ${filePath}`] };
  }

  const ids = new Set<string>();
  const warnings: string[] = [];

  const markerRegex = /@awa-(?:impl|test|component):\s*(.+)/g;
  const idTokenRegex = /[A-Z][A-Z0-9]*(?:[-_][A-Za-z0-9]+)*(?:\.\d+)?/g;

  const lines = content.split('\n');
  for (const line of lines) {
    let markerMatch = markerRegex.exec(line);
    while (markerMatch !== null) {
      const idsText = markerMatch[1] ?? '';
      let idMatch = idTokenRegex.exec(idsText);
      while (idMatch !== null) {
        ids.add(idMatch[0]);
        idMatch = idTokenRegex.exec(idsText);
      }
      markerMatch = markerRegex.exec(line);
    }
  }

  // Validate resolved IDs
  const resolved: string[] = [];
  for (const id of ids) {
    if (index.allIds.has(id)) {
      resolved.push(id);
    } else {
      warnings.push(`Marker ID '${id}' not found in specs`);
    }
  }

  if (resolved.length === 0 && warnings.length === 0) {
    warnings.push(`No traceability markers found in file: ${filePath}`);
  }

  return { ids: resolved, warnings };
}
