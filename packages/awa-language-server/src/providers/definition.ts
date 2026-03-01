// Implements PLAN-010 Phase 4: Go-to-Definition Provider

import type { Definition, Position } from 'vscode-languageserver/node.js';
import { Location, Range } from 'vscode-languageserver/node.js';
import type { LspSpecIndex } from '../spec-index.js';
import { uriToPath } from './hover.js';

/**
 * Given a cursor position over an @awa-* marker ID, return the location of
 * that ID's definition in the spec file.
 */
export function provideDefinition(
  uri: string,
  position: Position,
  index: LspSpecIndex
): Definition | null {
  const filePath = uriToPath(uri);
  const markers = index.markers.get(filePath);
  if (!markers) return null;

  const line = position.line + 1; // Convert to 1-based
  const character = position.character; // 0-based

  const marker = markers.find(
    (m) => m.line === line && m.startColumn <= character && character < m.endColumn
  );
  if (!marker) return null;

  const info = index.ids.get(marker.id);
  if (!info) return null;

  // Jump to the line in the spec file where the ID is defined
  // LSP uses 0-based lines, so subtract 1
  const targetLine = info.line - 1;
  return Location.create(pathToUri(info.filePath), Range.create(targetLine, 0, targetLine, 0));
}

export function pathToUri(filePath: string): string {
  if (!filePath.startsWith('/')) {
    return `file:///${encodeURIComponent(filePath)}`;
  }
  return `file://${encodeURI(filePath)}`;
}
