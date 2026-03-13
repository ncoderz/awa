// @awa-component: CLI-SpecSpecChecker
// @awa-impl: CLI-20_AC-1
// @awa-impl: CLI-22_AC-1
// @awa-impl: CLI-30_AC-1
// @awa-impl: CLI-36_AC-1
// @awa-impl: DEP-3_AC-1
// @awa-impl: DEP-3_AC-4
// @awa-impl: DEP-5_AC-2
// @awa-impl: DEP-5_AC-3
// @awa-impl: DEP-6_AC-3

import type {
  CheckConfig,
  CheckResult,
  Finding,
  MarkerScanResult,
  SpecParseResult,
} from './types.js';

// @awa-impl: CLI-20_AC-1, CLI-22_AC-1, CLI-36_AC-1
// @awa-impl: DEP-3_AC-1, DEP-3_AC-4, DEP-5_AC-2, DEP-5_AC-3, DEP-6_AC-3
export function checkSpecAgainstSpec(
  specs: SpecParseResult,
  markers: MarkerScanResult,
  config: CheckConfig,
  deprecatedIds: ReadonlySet<string> = new Set(),
): CheckResult {
  const findings: Finding[] = [];

  // @awa-impl: CLI-20_AC-1
  // @awa-impl: DEP-5_AC-2, DEP-5_AC-3, DEP-6_AC-3
  // Check cross-references resolve to real IDs
  for (const specFile of specs.specFiles) {
    for (const crossRef of specFile.crossRefs) {
      for (const refId of crossRef.ids) {
        if (!specs.allIds.has(refId)) {
          // Check if it's a deprecated ID
          if (deprecatedIds.has(refId)) {
            if (config.deprecated) {
              findings.push({
                severity: 'warning',
                code: 'deprecated-ref',
                message: `Cross-reference '${refId}' (${crossRef.type}) targets a deprecated ID`,
                filePath: crossRef.filePath,
                line: crossRef.line,
                id: refId,
              });
            }
            continue;
          }
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

  // @awa-impl: CLI-36_AC-1
  // @awa-impl: DEP-3_AC-1, DEP-3_AC-4
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

  // Build set of deprecated requirement IDs (for suppressing their child ACs)
  const deprecatedReqIds = new Set<string>();
  for (const id of deprecatedIds) {
    // Match requirement IDs: CODE-N or CODE-N.P (no _AC- or _P- suffix)
    if (/^[A-Z][A-Z0-9]*-\d+(?:\.\d+)?$/.test(id)) {
      deprecatedReqIds.add(id);
    }
  }

  for (const acId of reqAcIds) {
    // Skip if the AC itself is deprecated
    if (deprecatedIds.has(acId)) continue;
    // Skip if the parent requirement is deprecated (e.g., FOO-1_AC-2 → parent FOO-1)
    const parentMatch = /^([A-Z][A-Z0-9]*-\d+(?:\.\d+)?)_AC-\d+$/.exec(acId);
    if (parentMatch?.[1] && deprecatedReqIds.has(parentMatch[1])) continue;

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

  // @awa-impl: CLI-22_AC-1
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
