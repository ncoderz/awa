// @awa-component: CHK-SpecSpecChecker
// @awa-impl: CHK-5_AC-1
// @awa-impl: CHK-7_AC-1
// @awa-impl: CHK-15_AC-1
// @awa-impl: CHK-21_AC-1

import type {
  CheckConfig,
  CheckResult,
  Finding,
  MarkerScanResult,
  SpecParseResult,
} from './types.js';

// @awa-impl: CHK-5_AC-1, CHK-7_AC-1, CHK-21_AC-1
export function checkSpecAgainstSpec(
  specs: SpecParseResult,
  markers: MarkerScanResult,
  config: CheckConfig
): CheckResult {
  const findings: Finding[] = [];

  // @awa-impl: CHK-5_AC-1
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

  // @awa-impl: CHK-21_AC-1
  // G3: Check that every REQ AC is claimed by at least one DESIGN IMPLEMENTS
  const implementedAcIds = new Set<string>();
  for (const specFile of specs.specFiles) {
    for (const crossRef of specFile.crossRefs) {
      if (crossRef.type === 'implements') {
        for (const id of crossRef.ids) {
          implementedAcIds.add(id);
        }
      }
    }
  }

  // Only check ACs that come from REQ files (not DESIGN/TASK/etc.)
  const reqAcIds = new Set<string>();
  for (const specFile of specs.specFiles) {
    if (/\bREQ-/.test(specFile.filePath)) {
      for (const acId of specFile.acIds) {
        reqAcIds.add(acId);
      }
    }
  }

  for (const acId of reqAcIds) {
    if (!implementedAcIds.has(acId)) {
      const loc = specs.idLocations.get(acId);
      findings.push({
        severity: 'error',
        code: 'unlinked-ac',
        message: `Acceptance criterion '${acId}' is not claimed by any DESIGN IMPLEMENTS`,
        filePath: loc?.filePath,
        line: loc?.line,
        id: acId,
      });
    }
  }

  // @awa-impl: CHK-7_AC-1
  // Check for orphaned spec files (CODE not referenced by any other spec or code)
  // Skip when specOnly — orphaned-spec detection depends on code markers to be meaningful
  if (!config.specOnly) {
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
  }

  return { findings };
}
