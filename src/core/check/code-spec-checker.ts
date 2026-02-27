// @awa-component: CHK-CodeSpecChecker
// @awa-impl: CHK-3_AC-1
// @awa-impl: CHK-4_AC-1
// @awa-impl: CHK-6_AC-1
// @awa-impl: CHK-14_AC-1

import type {
  CheckConfig,
  CheckResult,
  Finding,
  MarkerScanResult,
  SpecParseResult,
} from './types.js';

// @awa-impl: CHK-3_AC-1, CHK-4_AC-1, CHK-6_AC-1
export function checkCodeAgainstSpec(
  markers: MarkerScanResult,
  specs: SpecParseResult,
  config: CheckConfig
): CheckResult {
  const findings: Finding[] = [];

  // @awa-impl: CHK-6_AC-1, CHK-14_AC-1
  // Validate ID format for all markers
  const idRegex = new RegExp(`^${config.idPattern}$`);
  for (const marker of markers.markers) {
    if (marker.type === 'component') {
      // Component names have different format — skip ID pattern check
      continue;
    }
    if (!idRegex.test(marker.id)) {
      findings.push({
        severity: 'error',
        code: 'invalid-id-format',
        message: `Marker ID '${marker.id}' does not match expected pattern: ${config.idPattern}`,
        filePath: marker.filePath,
        line: marker.line,
        id: marker.id,
      });
    }
  }

  // @awa-impl: CHK-3_AC-1
  // Check for orphaned markers (code references non-existent spec ID)
  for (const marker of markers.markers) {
    if (marker.type === 'component') {
      // Component markers reference component names
      if (!specs.componentNames.has(marker.id)) {
        findings.push({
          severity: 'error',
          code: 'orphaned-marker',
          message: `Component marker '${marker.id}' not found in any spec file`,
          filePath: marker.filePath,
          line: marker.line,
          id: marker.id,
        });
      }
    } else {
      // impl and test markers reference IDs (ACs, properties, requirement IDs)
      if (!specs.allIds.has(marker.id)) {
        findings.push({
          severity: 'error',
          code: 'orphaned-marker',
          message: `Marker '${marker.id}' not found in any spec file`,
          filePath: marker.filePath,
          line: marker.line,
          id: marker.id,
        });
      }
    }
  }

  // @awa-impl: CHK-4_AC-1
  // Check for uncovered ACs (spec ACs with no @awa-test reference)
  const testedIds = new Set(markers.markers.filter((m) => m.type === 'test').map((m) => m.id));

  for (const acId of specs.acIds) {
    if (!testedIds.has(acId)) {
      // Look up location from idLocations map, fall back to spec file path
      const loc = specs.idLocations.get(acId);
      const specFile = loc ? undefined : specs.specFiles.find((sf) => sf.acIds.includes(acId));
      findings.push({
        severity: 'warning',
        code: 'uncovered-ac',
        message: `Acceptance criterion '${acId}' has no @awa-test reference`,
        filePath: loc?.filePath ?? specFile?.filePath,
        line: loc?.line,
        id: acId,
      });
    }
  }

  return { findings };
}
