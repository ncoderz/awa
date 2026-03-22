import type { CheckResult, Finding, SpecParseResult } from './types.js';

export function checkDuplicateIds(specs: SpecParseResult): CheckResult {
  const findings: Finding[] = [];

  for (const [id, locations] of specs.allIdLocations) {
    if (locations.length <= 1) continue;

    // Report each duplicate occurrence beyond the first
    for (let i = 1; i < locations.length; i++) {
      const loc = locations[i]!;
      const locationList = locations.map((l) => `${l.filePath}:${l.line}`).join(', ');
      findings.push({
        severity: 'error',
        code: 'duplicate-spec-id',
        message: `Spec ID '${id}' is defined multiple times: ${locationList}`,
        filePath: loc.filePath,
        line: loc.line,
        id,
      });
    }
  }

  return { findings };
}
