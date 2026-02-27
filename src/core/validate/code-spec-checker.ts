// @awa-component: VAL-CodeSpecChecker
// @awa-impl: VAL-3_AC-1
// @awa-impl: VAL-4_AC-1
// @awa-impl: VAL-6_AC-1
// @awa-impl: VAL-14_AC-1

import type {
  CheckResult,
  Finding,
  MarkerScanResult,
  SpecParseResult,
  ValidateConfig,
} from './types.js';

// @awa-impl: VAL-3_AC-1, VAL-4_AC-1, VAL-6_AC-1
export function checkCodeAgainstSpec(
  markers: MarkerScanResult,
  specs: SpecParseResult,
  config: ValidateConfig
): CheckResult {
  const findings: Finding[] = [];

  // @awa-impl: VAL-6_AC-1, VAL-14_AC-1
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
        message: `Marker ID '${marker.id}' does not match expected pattern`,
        filePath: marker.filePath,
        line: marker.line,
        id: marker.id,
      });
    }
  }

  // @awa-impl: VAL-3_AC-1
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

  // @awa-impl: VAL-4_AC-1
  // Check for uncovered ACs (spec ACs with no @awa-test reference)
  const testedIds = new Set(markers.markers.filter((m) => m.type === 'test').map((m) => m.id));

  for (const acId of specs.acIds) {
    if (!testedIds.has(acId)) {
      // Find the spec file containing this AC for location info
      const specFile = specs.specFiles.find((sf) => sf.acIds.includes(acId));
      findings.push({
        severity: 'warning',
        code: 'uncovered-ac',
        message: `Acceptance criterion '${acId}' has no @awa-test reference`,
        filePath: specFile?.filePath,
        id: acId,
      });
    }
  }

  return { findings };
}
