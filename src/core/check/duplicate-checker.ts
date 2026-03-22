import type { CheckResult, Finding, SpecParseResult } from './types.js';

export function checkDuplicateIds(specs: SpecParseResult): CheckResult {
  const findings: Finding[] = [];

  for (const [id, locations] of specs.allIdLocations) {
    if (locations.length <= 1) continue;

    // Report each duplicate occurrence beyond the first
    for (let i = 1; i < locations.length; i++) {
      const locationList = locations
        .map((loc) => `${loc.filePath}:${loc.line}`)
        .join(', ');
      findings.push({
        severity: 'error',
        code: 'duplicate-spec-id',
        message: `Spec ID '${id}' is defined multiple times: ${locationList}`,
        filePath: locations[i].filePath,
        line: locations[i].line,
        id,
      });
    }
  }

  return { findings };
}
