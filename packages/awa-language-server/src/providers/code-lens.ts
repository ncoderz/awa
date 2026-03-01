// Implements PLAN-010 Phase 8: Code Lens

import type { CodeLens, Range } from 'vscode-languageserver/node.js';
import type { LspSpecIndex } from '../spec-index.js';
import { uriToPath } from './hover.js';

/**
 * Provide code lens above @awa-impl and @awa-test markers, showing:
 * - For @awa-impl: "N tests | M design refs"
 * - For @awa-test: "N implementations"
 */
export function provideCodeLens(uri: string, index: LspSpecIndex): CodeLens[] {
  const filePath = uriToPath(uri);
  const markers = index.markers.get(filePath);
  if (!markers) return [];

  const lenses: CodeLens[] = [];

  for (const marker of markers) {
    if (marker.type !== 'impl' && marker.type !== 'test') continue;

    const range: Range = {
      start: { line: marker.line - 1, character: 0 },
      end: { line: marker.line - 1, character: 0 },
    };

    if (marker.type === 'impl') {
      const testCount = (index.tests.get(marker.id) ?? []).length;
      const label =
        testCount > 0
          ? `${marker.id} — ${testCount} test${testCount !== 1 ? 's' : ''}`
          : `${marker.id} — no tests`;

      lenses.push({
        range,
        command: {
          title: label,
          command: 'awa.trace',
          arguments: [marker.id],
        },
      });
    } else {
      // type === 'test'
      const implCount = (index.implementations.get(marker.id) ?? []).length;
      const label =
        implCount > 0
          ? `${marker.id} — ${implCount} impl${implCount !== 1 ? 's' : ''}`
          : `${marker.id} — no implementations`;

      lenses.push({
        range,
        command: {
          title: label,
          command: 'awa.trace',
          arguments: [marker.id],
        },
      });
    }
  }

  return lenses;
}
