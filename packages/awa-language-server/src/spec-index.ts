// Implements PLAN-010 Phase 1: Spec Index for LSP

import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { collectFiles, DEFAULT_CHECK_CONFIG } from '@ncoderz/awa-core';

// ─────────────────────────────────────────
// Public types
// ─────────────────────────────────────────

export type LspIdType = 'requirement' | 'ac' | 'property' | 'component';

export interface LspIdInfo {
  id: string;
  type: LspIdType;
  /** Human-readable text for this ID (requirement title, AC criterion, etc). */
  text: string;
  filePath: string;
  /** 1-based line number where this ID is defined in the spec file. */
  line: number;
  /** Feature code prefix, e.g. "DIFF" from "DIFF-1". */
  featureCode: string;
}

export interface LspMarkerInfo {
  type: 'impl' | 'test' | 'component';
  id: string;
  /** 1-based line number. */
  line: number;
  /** 0-based character offset where the ID starts on the line. */
  startColumn: number;
  /** 0-based character offset where the ID ends on the line (exclusive). */
  endColumn: number;
}

export interface LspCodeLocation {
  filePath: string;
  /** 1-based line number. */
  line: number;
}

/**
 * The full LSP spec index — all data needed to answer hover, definition,
 * diagnostics, and completion requests.
 */
export interface LspSpecIndex {
  /** ID → metadata (text, type, location). */
  ids: Map<string, LspIdInfo>;
  /** filePath → markers in that file (with precise column info for hover). */
  markers: Map<string, LspMarkerInfo[]>;
  /** ID → impl (@awa-impl) code locations. */
  implementations: Map<string, LspCodeLocation[]>;
  /** ID → test (@awa-test) code locations. */
  tests: Map<string, LspCodeLocation[]>;
  /** Component name → @awa-component code locations. */
  components: Map<string, LspCodeLocation[]>;
}

// ─────────────────────────────────────────
// Spec file parsing — extract IDs + text
// ─────────────────────────────────────────

// ### CODE-N: Title text
const REQ_ID_RE = /^###\s+([A-Z][A-Z0-9]*-\d+(?:\.\d+)?)\s*:\s*(.*)/;
// - CODE-N_AC-M criterion text   OR   - [ ] CODE-N_AC-M criterion text
const AC_ID_RE = /^-\s+(?:\[[ x]\]\s+)?([A-Z][A-Z0-9]*-\d+(?:\.\d+)?_AC-\d+)\s+(.*)/;
// - CODE_P-N property text
const PROP_ID_RE = /^-\s+([A-Z][A-Z0-9]*_P-\d+)\s+(.*)/;
// ### CODE-ComponentName  (no trailing colon → distinguishes from requirement)
const COMPONENT_RE = /^###\s+([A-Z][A-Z0-9]*-[A-Za-z][A-Za-z0-9]*(?:[A-Z][a-z0-9]*)*)\s*$/;

function extractFeatureCode(id: string): string {
  const m = /^([A-Z][A-Z0-9]*)/.exec(id);
  return m?.[1] ?? '';
}

export async function parseSpecFileForLsp(filePath: string): Promise<Map<string, LspIdInfo>> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return new Map();
  }
  return parseSpecContentForLsp(filePath, content);
}

export function parseSpecContentForLsp(filePath: string, content: string): Map<string, LspIdInfo> {
  const ids = new Map<string, LspIdInfo>();
  const lines = content.split('\n');

  for (const [i, line] of lines.entries()) {
    const lineNum = i + 1;

    // Requirement ID with text: ### CODE-N: Title
    const reqMatch = REQ_ID_RE.exec(line);
    if (reqMatch?.[1] && reqMatch[2] !== undefined) {
      const id = reqMatch[1];
      ids.set(id, {
        id,
        type: 'requirement',
        text: reqMatch[2].trim(),
        filePath,
        line: lineNum,
        featureCode: extractFeatureCode(id),
      });
      continue;
    }

    // AC ID with text: - CODE-N_AC-M criterion text
    const acMatch = AC_ID_RE.exec(line);
    if (acMatch?.[1] && acMatch[2] !== undefined) {
      const id = acMatch[1];
      ids.set(id, {
        id,
        type: 'ac',
        text: acMatch[2].trim(),
        filePath,
        line: lineNum,
        featureCode: extractFeatureCode(id),
      });
      continue;
    }

    // Property ID: - CODE_P-N text (must not match as AC)
    const propMatch = PROP_ID_RE.exec(line);
    if (propMatch?.[1] && !AC_ID_RE.test(line)) {
      const id = propMatch[1];
      ids.set(id, {
        id,
        type: 'property',
        text: propMatch[2]?.trim() ?? '',
        filePath,
        line: lineNum,
        featureCode: extractFeatureCode(id),
      });
      continue;
    }

    // Component name: ### CODE-ComponentName
    const compMatch = COMPONENT_RE.exec(line);
    if (compMatch?.[1] && !REQ_ID_RE.test(line)) {
      const id = compMatch[1];
      ids.set(id, {
        id,
        type: 'component',
        text: id,
        filePath,
        line: lineNum,
        featureCode: extractFeatureCode(id),
      });
    }
  }

  return ids;
}

// ─────────────────────────────────────────
// Code file marker scanning (with columns)
// ─────────────────────────────────────────

const MARKER_RE = /(@awa-(?:impl|test|component)):\s*(.+)/g;
const ID_TOKEN_RE = /^([A-Z][A-Z0-9]*(?:[-_][A-Za-z0-9]+)*(?:\.\d+)?)/;
const MARKER_TYPE_MAP: Record<string, LspMarkerInfo['type']> = {
  '@awa-impl': 'impl',
  '@awa-test': 'test',
  '@awa-component': 'component',
};

export function scanCodeContentForLsp(content: string): LspMarkerInfo[] {
  const markers: LspMarkerInfo[] = [];
  const lines = content.split('\n');

  for (const [i, line] of lines.entries()) {
    const lineNum = i + 1;
    MARKER_RE.lastIndex = 0;
    let match = MARKER_RE.exec(line);
    while (match !== null) {
      const markerName = match[1] ?? '';
      const idsRaw = match[2] ?? '';
      const markerType = MARKER_TYPE_MAP[markerName] ?? 'impl';
      // idsStartInLine: column where the IDs list begins (after '@awa-impl: ')
      const idsStartInLine = (match.index ?? 0) + markerName.length + 2; // +2 for ': '

      let offset = 0;
      for (const rawId of idsRaw.split(',')) {
        const trimmed = rawId.trim();
        if (trimmed) {
          const leading = rawId.length - rawId.trimStart().length;
          const tokenMatch = ID_TOKEN_RE.exec(trimmed);
          const cleanId = tokenMatch?.[1] ?? '';
          if (cleanId) {
            const startCol = idsStartInLine + offset + leading;
            markers.push({
              type: markerType,
              id: cleanId,
              line: lineNum,
              startColumn: startCol,
              endColumn: startCol + cleanId.length,
            });
          }
        }
        offset += rawId.length + 1; // +1 for ','
      }
      match = MARKER_RE.exec(line);
    }
  }

  return markers;
}

async function scanCodeFileForLsp(filePath: string): Promise<LspMarkerInfo[]> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return [];
  }
  return scanCodeContentForLsp(content);
}

// ─────────────────────────────────────────
// Index builder
// ─────────────────────────────────────────

function addToMap<V>(map: Map<string, V[]>, key: string, value: V): void {
  const arr = map.get(key) ?? [];
  arr.push(value);
  map.set(key, arr);
}

/**
 * Build a full LspSpecIndex from scratch for the given workspace root.
 * Uses the same glob patterns as `awa check`.
 */
export async function buildLspSpecIndex(workspaceRoot: string): Promise<LspSpecIndex> {
  const config = DEFAULT_CHECK_CONFIG;

  // 1. Parse spec files for ID text
  const specGlobs = config.specGlobs.map((g) => resolve(workspaceRoot, g));
  const specFiles = await collectFiles(specGlobs, []);

  const ids = new Map<string, LspIdInfo>();
  for (const filePath of specFiles) {
    const fileIds = await parseSpecFileForLsp(filePath);
    for (const [id, info] of fileIds) ids.set(id, info);
  }

  // 2. Scan code files for markers with column positions
  const ignored = config.codeIgnore.map((g) => resolve(workspaceRoot, g));
  const codeFiles = await collectFiles(
    config.codeGlobs.map((g) => resolve(workspaceRoot, g)),
    ignored
  );

  const markersByFile = new Map<string, LspMarkerInfo[]>();
  const implementations = new Map<string, LspCodeLocation[]>();
  const tests = new Map<string, LspCodeLocation[]>();
  const components = new Map<string, LspCodeLocation[]>();

  await Promise.all(
    codeFiles.map(async (filePath) => {
      const fileMarkers = await scanCodeFileForLsp(filePath);
      if (fileMarkers.length === 0) return;
      markersByFile.set(filePath, fileMarkers);
      for (const m of fileMarkers) {
        const loc: LspCodeLocation = { filePath, line: m.line };
        if (m.type === 'impl') addToMap(implementations, m.id, loc);
        else if (m.type === 'test') addToMap(tests, m.id, loc);
        else addToMap(components, m.id, loc);
      }
    })
  );

  return { ids, markers: markersByFile, implementations, tests, components };
}

/**
 * Incrementally re-index a single changed file without full rebuild.
 * Call this from file-watcher callbacks to keep the index fresh.
 */
export async function updateLspIndexForFile(filePath: string, index: LspSpecIndex): Promise<void> {
  const isSpecFile =
    /\.(md|tsp)$/.test(filePath) &&
    (filePath.includes(`${sep}.awa${sep}`) || filePath.includes('/.awa/'));

  if (isSpecFile) {
    // Remove IDs from this file, re-parse
    for (const [id, info] of index.ids) {
      if (info.filePath === filePath) index.ids.delete(id);
    }
    const fileIds = await parseSpecFileForLsp(filePath);
    for (const [id, info] of fileIds) index.ids.set(id, info);
  } else {
    // Remove old markers for this file from all location maps
    const oldMarkers = index.markers.get(filePath) ?? [];
    for (const m of oldMarkers) {
      const locationMap =
        m.type === 'impl'
          ? index.implementations
          : m.type === 'test'
            ? index.tests
            : index.components;
      const arr = locationMap.get(m.id);
      if (arr) {
        const filtered = arr.filter((loc) => loc.filePath !== filePath);
        if (filtered.length === 0) locationMap.delete(m.id);
        else locationMap.set(m.id, filtered);
      }
    }

    // Re-scan
    const newMarkers = await scanCodeFileForLsp(filePath);
    if (newMarkers.length > 0) {
      index.markers.set(filePath, newMarkers);
      for (const m of newMarkers) {
        const loc: LspCodeLocation = { filePath, line: m.line };
        const locationMap =
          m.type === 'impl'
            ? index.implementations
            : m.type === 'test'
              ? index.tests
              : index.components;
        addToMap(locationMap, m.id, loc);
      }
    } else {
      index.markers.delete(filePath);
    }
  }
}
