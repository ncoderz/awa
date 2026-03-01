// Implements PLAN-010 Phase 3: Hover Provider

import type { Hover, Position } from 'vscode-languageserver/node.js';
import { MarkupKind } from 'vscode-languageserver/node.js';
import type { LspMarkerInfo, LspSpecIndex } from '../spec-index.js';

/**
 * Given a document URI and cursor position, return a hover result if the
 * cursor is on an @awa-* marker ID. Returns null if no hover applies.
 */
export function provideHover(
  uri: string,
  position: Position,
  _content: string,
  index: LspSpecIndex
): Hover | null {
  const filePath = uriToPath(uri);
  const markers = index.markers.get(filePath);
  if (!markers) return null;

  const line = position.line + 1; // Convert to 1-based
  const character = position.character; // 0-based column

  const marker = findMarkerAtPosition(markers, line, character);
  if (!marker) return null;

  return buildHover(marker, index);
}

function findMarkerAtPosition(
  markers: LspMarkerInfo[],
  line: number,
  character: number
): LspMarkerInfo | undefined {
  return markers.find(
    (m) => m.line === line && m.startColumn <= character && character < m.endColumn
  );
}

function buildHover(marker: LspMarkerInfo, index: LspSpecIndex): Hover | null {
  const info = index.ids.get(marker.id);
  if (!info) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**${marker.id}** — _ID not found in any spec file_`,
      },
    };
  }

  const typeLabel = typeToLabel(info.type);
  const implCount = (index.implementations.get(marker.id) ?? []).length;
  const testCount = (index.tests.get(marker.id) ?? []).length;

  const lines: string[] = [
    `### ${typeLabel}: \`${info.id}\``,
    '',
    info.text ? info.text : '_No description found_',
    '',
    `**Feature:** ${info.featureCode}`,
    `**Defined in:** ${formatFilePath(info.filePath)}:${info.line}`,
  ];

  if (implCount > 0 || testCount > 0) {
    lines.push('');
    const parts: string[] = [];
    if (implCount > 0) parts.push(`${implCount} impl${implCount !== 1 ? 's' : ''}`);
    if (testCount > 0) parts.push(`${testCount} test${testCount !== 1 ? 's' : ''}`);
    lines.push(`_${parts.join(' · ')}_`);
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: lines.join('\n'),
    },
  };
}

function typeToLabel(type: string): string {
  switch (type) {
    case 'requirement':
      return 'Requirement';
    case 'ac':
      return 'Acceptance Criterion';
    case 'property':
      return 'Property';
    case 'component':
      return 'Design Component';
    default:
      return 'ID';
  }
}

function formatFilePath(filePath: string): string {
  // Strip workspace-absolute prefix for display, prefer .awa/... style
  const awaIdx = filePath.indexOf('.awa/');
  if (awaIdx !== -1) return filePath.slice(awaIdx);
  const srcIdx = filePath.indexOf('/src/');
  if (srcIdx !== -1) return filePath.slice(srcIdx + 1);
  return filePath;
}

export function uriToPath(uri: string): string {
  // file:///path/to/file.ts → /path/to/file.ts
  if (uri.startsWith('file://')) {
    return decodeURIComponent(uri.slice(7));
  }
  return uri;
}
