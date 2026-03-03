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

import type {
  CheckConfig,
  CheckResult,
  Finding,
  MarkerScanResult,
  SpecParseResult,
} from './types.js';

// @awa-impl: CLI-18_AC-1, CLI-19_AC-1, CLI-21_AC-1, CLI-33_AC-1, CLI-34_AC-1, CLI-35_AC-1, CLI-36_AC-1, CLI-37_AC-1
export function checkCodeAgainstSpec(
  markers: MarkerScanResult,
  specs: SpecParseResult,
  config: CheckConfig
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

  // @awa-impl: CLI-19_AC-1
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

  // @awa-impl: CLI-33_AC-1
  // Check for uncovered components (DESIGN components with no @awa-component marker)
  const implementedComponents = new Set(
    markers.markers.filter((m) => m.type === 'component').map((m) => m.id)
  );

  for (const componentName of specs.componentNames) {
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
  // Check for unimplemented ACs (spec ACs with no @awa-impl marker)
  const implementedIds = new Set(markers.markers.filter((m) => m.type === 'impl').map((m) => m.id));

  for (const acId of specs.acIds) {
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
  // G5: Check for uncovered properties (spec properties with no @awa-test marker)
  for (const propId of specs.propertyIds) {
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
  // For each @awa-component marker in code, compare the set of @awa-impl IDs
  // in the same file against the DESIGN component's IMPLEMENTS list
  const componentFiles = new Map<string, Set<string>>();
  for (const marker of markers.markers) {
    if (marker.type === 'component') {
      if (!componentFiles.has(marker.id)) {
        componentFiles.set(marker.id, new Set());
      }
    }
  }
  // Collect all @awa-impl IDs per component (by file co-location)
  // A file's component is determined by @awa-component markers in that file
  const fileToComponents = new Map<string, string[]>();
  for (const marker of markers.markers) {
    if (marker.type === 'component') {
      const existing = fileToComponents.get(marker.filePath) ?? [];
      existing.push(marker.id);
      fileToComponents.set(marker.filePath, existing);
    }
  }
  for (const marker of markers.markers) {
    if (marker.type === 'impl') {
      const components = fileToComponents.get(marker.filePath);
      if (components) {
        for (const comp of components) {
          componentFiles.get(comp)?.add(marker.id);
        }
      }
    }
  }

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
