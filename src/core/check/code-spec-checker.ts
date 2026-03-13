// @awa-component: CLI-CodeSpecChecker
// @awa-impl: CLI-18_AC-1
// @awa-impl: CLI-19_AC-1
// @awa-impl: CLI-21_AC-1
// @awa-impl: CLI-29_AC-1
// @awa-impl: CLI-33_AC-1
// @awa-impl: CLI-34_AC-1
// @awa-impl: CLI-35_AC-1
// @awa-impl: CLI-36_AC-1
// @awa-impl: CLI-37_AC-1
// @awa-impl: DEP-3_AC-1
// @awa-impl: DEP-3_AC-2
// @awa-impl: DEP-3_AC-3
// @awa-impl: DEP-5_AC-1
// @awa-impl: DEP-6_AC-2

import type {
  CheckConfig,
  CheckResult,
  CodeMarker,
  Finding,
  MarkerScanResult,
  SpecParseResult,
} from './types.js';

/**
 * Build a map of component → Set<impl/test marker IDs> using positional scoping.
 * Each @awa-impl or @awa-test is attributed to the nearest preceding @awa-component
 * in the same file by line number.
 */
export function buildComponentAttribution(
  markers: readonly CodeMarker[],
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();

  // Ensure every component gets an entry (even if no impl/test follows it)
  for (const m of markers) {
    if (m.type === 'component' && !result.has(m.id)) {
      result.set(m.id, new Set());
    }
  }

  // Group markers by file
  const byFile = new Map<string, CodeMarker[]>();
  for (const m of markers) {
    const list = byFile.get(m.filePath) ?? [];
    list.push(m);
    byFile.set(m.filePath, list);
  }

  for (const fileMarkers of byFile.values()) {
    // Sort by line within each file
    const sorted = [...fileMarkers].sort((a, b) => a.line - b.line);
    let activeComponent: string | null = null;

    for (const m of sorted) {
      if (m.type === 'component') {
        activeComponent = m.id;
      } else {
        // impl or test — attribute to nearest preceding component
        if (activeComponent) {
          result.get(activeComponent)?.add(m.id);
        }
      }
    }
  }

  return result;
}

// @awa-impl: CLI-18_AC-1, CLI-19_AC-1, CLI-21_AC-1, CLI-33_AC-1, CLI-34_AC-1, CLI-35_AC-1, CLI-36_AC-1, CLI-37_AC-1
// @awa-impl: DEP-3_AC-1, DEP-3_AC-2, DEP-3_AC-3, DEP-5_AC-1, DEP-6_AC-2
export function checkCodeAgainstSpec(
  markers: MarkerScanResult,
  specs: SpecParseResult,
  config: CheckConfig,
  deprecatedIds: ReadonlySet<string> = new Set(),
): CheckResult {
  const findings: Finding[] = [];

  // @awa-impl: CLI-21_AC-1, CLI-29_AC-1
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

  // @awa-impl: CLI-18_AC-1
  // @awa-impl: DEP-5_AC-1, DEP-6_AC-2
  // Check for orphaned markers (code references non-existent spec ID)
  for (const marker of markers.markers) {
    if (marker.type === 'component') {
      // Component markers reference component names
      if (!specs.componentNames.has(marker.id)) {
        // Check if it's a deprecated ID
        if (deprecatedIds.has(marker.id)) {
          if (config.deprecated) {
            findings.push({
              severity: 'warning',
              code: 'deprecated-ref',
              message: `Component marker '${marker.id}' references a deprecated ID`,
              filePath: marker.filePath,
              line: marker.line,
              id: marker.id,
            });
          }
          continue;
        }
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
        // Check if it's a deprecated ID
        if (deprecatedIds.has(marker.id)) {
          if (config.deprecated) {
            findings.push({
              severity: 'warning',
              code: 'deprecated-ref',
              message: `Marker '${marker.id}' references a deprecated ID`,
              filePath: marker.filePath,
              line: marker.line,
              id: marker.id,
            });
          }
          continue;
        }
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

  // @awa-impl: CLI-19_AC-1
  // @awa-impl: DEP-3_AC-1
  // Check for uncovered ACs (spec ACs with no @awa-test reference)
  const testedIds = new Set(markers.markers.filter((m) => m.type === 'test').map((m) => m.id));

  for (const acId of specs.acIds) {
    if (deprecatedIds.has(acId)) continue;
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

  // @awa-impl: CLI-33_AC-1
  // @awa-impl: DEP-3_AC-3
  // Check for uncovered components (DESIGN components with no @awa-component marker)
  const implementedComponents = new Set(
    markers.markers.filter((m) => m.type === 'component').map((m) => m.id),
  );

  for (const componentName of specs.componentNames) {
    if (deprecatedIds.has(componentName)) continue;
    if (!implementedComponents.has(componentName)) {
      const loc = specs.idLocations.get(componentName);
      const specFile = loc
        ? undefined
        : specs.specFiles.find((sf) => sf.componentNames.includes(componentName));
      findings.push({
        severity: 'warning',
        code: 'uncovered-component',
        message: `Component '${componentName}' has no @awa-component reference`,
        filePath: loc?.filePath ?? specFile?.filePath,
        line: loc?.line,
        id: componentName,
      });
    }
  }

  // @awa-impl: CLI-34_AC-1
  // @awa-impl: DEP-3_AC-2
  // Check for unimplemented ACs (spec ACs with no @awa-impl marker)
  const implementedIds = new Set(markers.markers.filter((m) => m.type === 'impl').map((m) => m.id));

  for (const acId of specs.acIds) {
    if (deprecatedIds.has(acId)) continue;
    if (!implementedIds.has(acId)) {
      const loc = specs.idLocations.get(acId);
      const specFile = loc ? undefined : specs.specFiles.find((sf) => sf.acIds.includes(acId));
      findings.push({
        severity: 'warning',
        code: 'unimplemented-ac',
        message: `Acceptance criterion '${acId}' has no @awa-impl reference`,
        filePath: loc?.filePath ?? specFile?.filePath,
        line: loc?.line,
        id: acId,
      });
    }
  }

  // @awa-impl: CLI-35_AC-1
  // @awa-impl: DEP-3_AC-1
  // G5: Check for uncovered properties (spec properties with no @awa-test marker)
  for (const propId of specs.propertyIds) {
    if (deprecatedIds.has(propId)) continue;
    if (!testedIds.has(propId)) {
      const loc = specs.idLocations.get(propId);
      const specFile = loc
        ? undefined
        : specs.specFiles.find((sf) => sf.propertyIds.includes(propId));
      findings.push({
        severity: 'warning',
        code: 'uncovered-property',
        message: `Property '${propId}' has no @awa-test reference`,
        filePath: loc?.filePath ?? specFile?.filePath,
        line: loc?.line,
        id: propId,
      });
    }
  }

  // @awa-impl: CLI-37_AC-1
  // G1: Check IMPLEMENTS ↔ @awa-impl consistency
  // Use positional scoping: each @awa-impl is attributed to
  // the nearest preceding @awa-component in the same file
  const componentFiles = buildComponentAttribution(markers.markers);

  // Build the IMPLEMENTS set per component from all DESIGN spec files
  const designImplements = new Map<string, Set<string>>();
  for (const specFile of specs.specFiles) {
    if (specFile.componentImplements) {
      for (const [comp, ids] of specFile.componentImplements) {
        const existing = designImplements.get(comp) ?? new Set();
        for (const id of ids) existing.add(id);
        designImplements.set(comp, existing);
      }
    }
  }

  for (const [compName, codeImplIds] of componentFiles) {
    const designImplIds = designImplements.get(compName);
    if (!designImplIds) continue; // No DESIGN component found (already caught by orphaned-marker)

    // impl-not-in-implements: @awa-impl in code but not in DESIGN IMPLEMENTS
    for (const implId of codeImplIds) {
      if (!designImplIds.has(implId)) {
        findings.push({
          severity: 'warning',
          code: 'impl-not-in-implements',
          message: `@awa-impl '${implId}' in component '${compName}' is not listed in its IMPLEMENTS`,
          id: implId,
        });
      }
    }

    // implements-not-in-impl: DESIGN IMPLEMENTS but no @awa-impl in any file tagged with that component
    for (const implId of designImplIds) {
      if (!codeImplIds.has(implId)) {
        const loc = specs.idLocations.get(compName);
        findings.push({
          severity: 'warning',
          code: 'implements-not-in-impl',
          message: `IMPLEMENTS '${implId}' in component '${compName}' has no @awa-impl in code`,
          filePath: loc?.filePath,
          line: loc?.line,
          id: implId,
        });
      }
    }
  }

  return { findings };
}
