// @awa-component: DEP-ReservationChecker
// @awa-impl: DEP-4_AC-1
// @awa-impl: DEP-4_AC-2

import type { CheckResult, Finding, SpecParseResult } from './types.js';

// @awa-impl: DEP-4_AC-1, DEP-4_AC-2
export function checkReservations(
  specs: SpecParseResult,
  deprecatedIds: ReadonlySet<string>,
): CheckResult {
  const findings: Finding[] = [];

  for (const id of deprecatedIds) {
    if (specs.allIds.has(id)) {
      const loc = specs.idLocations.get(id);
      findings.push({
        severity: 'error',
        code: 'deprecated-id-conflict',
        message: `ID '${id}' is defined in active specs but is reserved by the deprecated file`,
        filePath: loc?.filePath,
        line: loc?.line,
        id,
      });
    }
  }

  return { findings };
}
