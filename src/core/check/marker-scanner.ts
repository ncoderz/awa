// @awa-component: CHK-MarkerScanner
// @awa-impl: CHK-1_AC-1
// @awa-impl: CHK-11_AC-1
// @awa-impl: CHK-13_AC-1

import { readFile } from 'node:fs/promises';
import { collectFiles } from './glob.js';
import type { CheckConfig, CodeMarker, Finding, MarkerScanResult, MarkerType } from './types.js';

const MARKER_TYPE_MAP: Record<string, MarkerType> = {
  '@awa-impl': 'impl',
  '@awa-test': 'test',
  '@awa-component': 'component',
};

// @awa-impl: CHK-1_AC-1
export async function scanMarkers(config: CheckConfig): Promise<MarkerScanResult> {
  const files = await collectCodeFiles(config.codeGlobs, config.ignore);
  const markers: CodeMarker[] = [];
  const findings: Finding[] = [];

  for (const filePath of files) {
    const result = await scanFile(filePath, config.markers);
    markers.push(...result.markers);
    findings.push(...result.findings);
  }

  return { markers, findings };
}

// @awa-impl: CHK-11_AC-1
function buildMarkerRegex(markerNames: readonly string[]): RegExp {
  const escaped = markerNames.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Match marker followed by colon, then capture the rest of the line (IDs)
  return new RegExp(`(${escaped.join('|')}):\\s*(.+)`, 'g');
}

/** Pattern matching valid impl/test IDs and component names. */
const ID_TOKEN_RE = /^([A-Z][A-Z0-9]*(?:[-_][A-Za-z0-9]+)*(?:\.\d+)?)/;

async function scanFile(
  filePath: string,
  markerNames: readonly string[]
): Promise<{ markers: CodeMarker[]; findings: Finding[] }> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return { markers: [], findings: [] };
  }

  const regex = buildMarkerRegex(markerNames);
  const lines = content.split('\n');
  const markers: CodeMarker[] = [];
  const findings: Finding[] = [];

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
        // Extract only the leading ID token
        const tokenMatch = ID_TOKEN_RE.exec(id);
        const cleanId = tokenMatch ? tokenMatch[1].trim() : '';
        if (cleanId) {
          // Check for trailing text after the ID (only whitespace allowed)
          const remainder = id.slice(tokenMatch![0].length).trim();
          if (remainder) {
            findings.push({
              severity: 'error',
              code: 'marker-trailing-text',
              message: `Marker has trailing text after ID '${cleanId}': '${remainder}' — use comma-separated IDs only`,
              filePath,
              line: i + 1,
              id: cleanId,
            });
          }
          markers.push({ type, id: cleanId, filePath, line: i + 1 });
        }
      }

      match = regex.exec(line);
    }
  }

  return { markers, findings };
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
