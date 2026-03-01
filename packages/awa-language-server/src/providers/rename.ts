// Implements PLAN-010 Phase 9: Rename Support

import { readFile } from 'node:fs/promises';
import type {
  PrepareRenameResult,
  RenameParams,
  WorkspaceEdit,
} from 'vscode-languageserver/node.js';
import { Range, TextEdit } from 'vscode-languageserver/node.js';
import type { LspMarkerInfo, LspSpecIndex } from '../spec-index.js';
import { pathToUri } from './definition.js';
import { uriToPath } from './hover.js';

/**
 * Validate that the cursor position is over a renameable marker ID.
 * Returns the range of the ID if renameable, null otherwise.
 */
export function prepareRename(
  uri: string,
  position: { line: number; character: number },
  index: LspSpecIndex
): PrepareRenameResult | null {
  const marker = findMarkerAtCursor(uri, position, index);
  if (!marker) return null;
  // Only allow rename if the ID is defined in a spec file
  if (!index.ids.has(marker.id)) return null;

  return {
    range: Range.create(marker.line - 1, marker.startColumn, marker.line - 1, marker.endColumn),
    placeholder: marker.id,
  };
}

/**
 * Rename a marker ID across all code and spec files.
 * Finds every `@awa-impl`, `@awa-test`, `@awa-component` marker with the old ID,
 * plus the defining line in the spec file, and returns a WorkspaceEdit.
 */
export async function provideRename(
  params: RenameParams,
  index: LspSpecIndex
): Promise<WorkspaceEdit | null> {
  const marker = findMarkerAtCursor(params.textDocument.uri, params.position, index);
  if (!marker) return null;

  const oldId = marker.id;
  const newId = params.newName.trim();

  if (!newId || newId === oldId) return null;

  // Build an ID boundary regex: ID must not be followed by alphanumeric/-/_
  const idBoundaryRe = new RegExp(`${escapeRegExp(oldId)}(?![\\w_\\-])`, 'g');

  const changes: Record<string, TextEdit[]> = {};

  // ── 1. Rename in code files via marker positions ────────────────────
  for (const [filePath, fileMarkers] of index.markers) {
    const edits: TextEdit[] = [];
    for (const m of fileMarkers) {
      if (m.id === oldId) {
        edits.push(
          TextEdit.replace(Range.create(m.line - 1, m.startColumn, m.line - 1, m.endColumn), newId)
        );
      }
    }
    if (edits.length > 0) {
      const uri = pathToUri(filePath);
      changes[uri] = (changes[uri] ?? []).concat(edits);
    }
  }

  // ── 2. Rename in spec file — find all lines containing oldId ────────
  const idInfo = index.ids.get(oldId);
  if (idInfo) {
    try {
      const content = await readFile(idInfo.filePath, 'utf-8');
      const lines = content.split('\n');
      const specEdits: TextEdit[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        idBoundaryRe.lastIndex = 0;
        let m: RegExpExecArray | null;
        // biome-ignore lint/suspicious/noAssignInExpressions: loop pattern
        while ((m = idBoundaryRe.exec(line)) !== null) {
          const col = m.index;
          specEdits.push(TextEdit.replace(Range.create(i, col, i, col + oldId.length), newId));
        }
      }

      if (specEdits.length > 0) {
        const specUri = pathToUri(idInfo.filePath);
        changes[specUri] = (changes[specUri] ?? []).concat(specEdits);
      }
    } catch {
      // If we can't read the spec file, skip it — code renames still apply
    }
  }

  if (Object.keys(changes).length === 0) return null;
  return { changes };
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function findMarkerAtCursor(
  uri: string,
  position: { line: number; character: number },
  index: LspSpecIndex
): LspMarkerInfo | undefined {
  const filePath = uriToPath(uri);
  const markers = index.markers.get(filePath);
  if (!markers) return undefined;

  const line = position.line + 1; // 1-based
  const character = position.character;

  return markers.find(
    (m) => m.line === line && m.startColumn <= character && character < m.endColumn
  );
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
