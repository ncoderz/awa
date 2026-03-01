// Implements PLAN-010 Phase 5: Diagnostics

import type { Diagnostic } from 'vscode-languageserver/node.js';
import { DiagnosticSeverity } from 'vscode-languageserver/node.js';
import type { LspSpecIndex } from '../spec-index.js';
import { uriToPath } from './hover.js';

/**
 * Compute diagnostics for a document. Detects:
 * - Orphaned markers: ID in code not found in any spec file (error)
 */
export function provideDiagnostics(uri: string, index: LspSpecIndex): Diagnostic[] {
  const filePath = uriToPath(uri);
  const markers = index.markers.get(filePath);
  if (!markers) return [];

  const diagnostics: Diagnostic[] = [];

  for (const marker of markers) {
    const isDefined = index.ids.has(marker.id);

    if (!isDefined) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: marker.line - 1, character: marker.startColumn },
          end: { line: marker.line - 1, character: marker.endColumn },
        },
        message: `Orphaned marker: '${marker.id}' is not defined in any spec file`,
        source: 'awa',
        code: 'orphaned-marker',
      });
    }
  }

  return diagnostics;
}
