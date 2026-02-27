// @awa-component: VAL-SpecSpecChecker
// @awa-impl: VAL-5_AC-1
// @awa-impl: VAL-7_AC-1
// @awa-impl: VAL-15_AC-1

import type {
  CheckResult,
  Finding,
  MarkerScanResult,
  SpecParseResult,
  ValidateConfig,
} from './types.js';

// @awa-impl: VAL-5_AC-1, VAL-7_AC-1
export function checkSpecAgainstSpec(
  specs: SpecParseResult,
  markers: MarkerScanResult,
  _config: ValidateConfig
): CheckResult {
  const findings: Finding[] = [];

  // @awa-impl: VAL-5_AC-1
  // Check cross-references resolve to real IDs
  for (const specFile of specs.specFiles) {
    for (const crossRef of specFile.crossRefs) {
      for (const refId of crossRef.ids) {
        if (!specs.allIds.has(refId)) {
          findings.push({
            severity: 'error',
            code: 'broken-cross-ref',
            message: `Cross-reference '${refId}' (${crossRef.type}) not found in any spec file`,
            filePath: crossRef.filePath,
            line: crossRef.line,
            id: refId,
          });
        }
      }
    }
  }

  // @awa-impl: VAL-7_AC-1
  // Check for orphaned spec files (CODE not referenced by any other spec or code)
  const referencedCodes = new Set<string>();

  // Collect codes referenced in code markers
  for (const marker of markers.markers) {
    const codeMatch = /^([A-Z][A-Z0-9]*)[-_]/.exec(marker.id);
    if (codeMatch?.[1]) {
      referencedCodes.add(codeMatch[1]);
    }
  }

  // Collect codes referenced in cross-references
  for (const specFile of specs.specFiles) {
    for (const crossRef of specFile.crossRefs) {
      for (const refId of crossRef.ids) {
        const codeMatch = /^([A-Z][A-Z0-9]*)[-_]/.exec(refId);
        if (codeMatch?.[1]) {
          referencedCodes.add(codeMatch[1]);
        }
      }
    }
  }

  for (const specFile of specs.specFiles) {
    if (!specFile.code) continue; // Skip ARCHITECTURE.md etc.
    if (!referencedCodes.has(specFile.code)) {
      findings.push({
        severity: 'warning',
        code: 'orphaned-spec',
        message: `Spec file code '${specFile.code}' is not referenced by any other spec or code marker`,
        filePath: specFile.filePath,
        id: specFile.code,
      });
    }
  }

  return { findings };
}
