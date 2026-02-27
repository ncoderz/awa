// @awa-component: CHK-MarkerScanner
// @awa-impl: CHK-1_AC-1
// @awa-impl: CHK-11_AC-1
// @awa-impl: CHK-13_AC-1

import { readFile } from 'node:fs/promises';
import { collectFiles } from './glob.js';
import type { CheckConfig, CodeMarker, MarkerScanResult, MarkerType } from './types.js';

const MARKER_TYPE_MAP: Record<string, MarkerType> = {
  '@awa-impl': 'impl',
  '@awa-test': 'test',
  '@awa-component': 'component',
};

// @awa-impl: CHK-1_AC-1
export async function scanMarkers(config: CheckConfig): Promise<MarkerScanResult> {
  const files = await collectCodeFiles(config.codeGlobs, config.ignore);
  const markers: CodeMarker[] = [];

  for (const filePath of files) {
    const fileMarkers = await scanFile(filePath, config.markers);
    markers.push(...fileMarkers);
  }

  return { markers };
}

// @awa-impl: CHK-11_AC-1
function buildMarkerRegex(markerNames: readonly string[]): RegExp {
  const escaped = markerNames.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Match marker followed by colon, then capture the rest of the line (IDs)
  return new RegExp(`(${escaped.join('|')}):\\s*(.+)`, 'g');
}

/** Pattern matching valid impl/test IDs and component names. */
const ID_TOKEN_RE = /^([A-Z][A-Z0-9]*(?:[-_][A-Za-z0-9]+)*(?:\.\d+)?)/;

async function scanFile(filePath: string, markerNames: readonly string[]): Promise<CodeMarker[]> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return [];
  }

  const regex = buildMarkerRegex(markerNames);
  const lines = content.split('\n');
  const markers: CodeMarker[] = [];

  for (const [i, line] of lines.entries()) {
    regex.lastIndex = 0;
    let match = regex.exec(line);

    while (match !== null) {
      const markerName = match[1] ?? '';
      const idsRaw = match[2] ?? '';
      const type = resolveMarkerType(markerName, markerNames);

      // Split by comma to support multiple IDs per marker line
      const ids = idsRaw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      for (const id of ids) {
        // Extract only the leading ID token, ignoring trailing comments/text
        const tokenMatch = ID_TOKEN_RE.exec(id);
        const cleanId = tokenMatch ? tokenMatch[1].trim() : '';
        if (cleanId) {
          markers.push({ type, id: cleanId, filePath, line: i + 1 });
        }
      }

      match = regex.exec(line);
    }
  }

  return markers;
}

function resolveMarkerType(markerName: string, configuredMarkers: readonly string[]): MarkerType {
  // Check default mapping first
  const mapped = MARKER_TYPE_MAP[markerName];
  if (mapped) return mapped;
  // For custom markers, infer type by position in configured array
  // Default order: [impl, test, component]
  const idx = configuredMarkers.indexOf(markerName);
  if (idx === 1) return 'test';
  if (idx === 2) return 'component';
  return 'impl';
}

// @awa-impl: CHK-13_AC-1
async function collectCodeFiles(
  codeGlobs: readonly string[],
  ignore: readonly string[]
): Promise<string[]> {
  return collectFiles(codeGlobs, ignore);
}
