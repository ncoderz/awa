// @awa-component: TRC-IndexBuilder
// @awa-impl: TRC-1_AC-1

import type { CodeMarker, MarkerScanResult, SpecParseResult } from '../check/types.js';
import type { CodeLocation, TraceIndex } from './types.js';

/**
 * Build a TraceIndex from already-collected spec parse results and marker scan results.
 * This reuses the same data `awa check` collects — no duplicate scanning.
 */
export function buildTraceIndex(specs: SpecParseResult, markers: MarkerScanResult): TraceIndex {
  // Forward maps
  const reqToACs = new Map<string, string[]>();
  const acToDesignComponents = new Map<string, string[]>();
  const acToCodeLocations = new Map<string, CodeLocation[]>();
  const acToTestLocations = new Map<string, CodeLocation[]>();
  const propertyToTestLocations = new Map<string, CodeLocation[]>();
  const componentToCodeLocations = new Map<string, CodeLocation[]>();

  // Reverse maps
  const acToReq = new Map<string, string>();
  const componentToACs = new Map<string, string[]>();
  const propertyToACs = new Map<string, string[]>();

  // 1. Build reqToACs and acToReq from spec parse results
  buildRequirementMaps(specs, reqToACs, acToReq);

  // 2. Build acToDesignComponents, componentToACs, propertyToACs from cross-references
  buildDesignMaps(specs, acToDesignComponents, componentToACs, propertyToACs);

  // 3. Build code/test location maps from markers
  buildMarkerMaps(
    markers.markers,
    acToCodeLocations,
    acToTestLocations,
    propertyToTestLocations,
    componentToCodeLocations
  );

  // 4. Collect all known IDs
  const allIds = new Set<string>([
    ...specs.requirementIds,
    ...specs.acIds,
    ...specs.propertyIds,
    ...specs.componentNames,
  ]);

  // 5. Copy idLocations from specs (already a ReadonlyMap<string, {filePath, line}>)
  const idLocations = new Map<string, CodeLocation>();
  for (const [id, loc] of specs.idLocations) {
    idLocations.set(id, loc);
  }

  return {
    reqToACs,
    acToDesignComponents,
    acToCodeLocations,
    acToTestLocations,
    propertyToTestLocations,
    componentToCodeLocations,
    acToReq,
    componentToACs,
    propertyToACs,
    idLocations,
    allIds,
  };
}

/** Build requirement → AC forward map and AC → requirement reverse map. */
function buildRequirementMaps(
  specs: SpecParseResult,
  reqToACs: Map<string, string[]>,
  acToReq: Map<string, string>
): void {
  // AC IDs embed their parent requirement: e.g. DIFF-1_AC-1 → parent is DIFF-1
  // Sub-requirement ACs: DIFF-1.1_AC-2 → parent is DIFF-1.1
  for (const acId of specs.acIds) {
    const parentReq = extractParentRequirement(acId);
    if (parentReq && specs.requirementIds.has(parentReq)) {
      pushToMap(reqToACs, parentReq, acId);
      acToReq.set(acId, parentReq);
    }
  }

  // Also build sub-requirement → parent links: DIFF-1.1 has parent DIFF-1
  for (const reqId of specs.requirementIds) {
    const dotIdx = reqId.lastIndexOf('.');
    if (dotIdx !== -1) {
      const parentReq = reqId.slice(0, dotIdx);
      if (specs.requirementIds.has(parentReq)) {
        // Sub-requirements are not ACs, but we can store in reqToACs for traversal
        // Actually, sub-requirements are requirements themselves — they appear in reqToACs
        // when their own ACs are found. No extra work needed.
      }
    }
  }
}

/** Build design cross-reference maps from IMPLEMENTS and VALIDATES. */
function buildDesignMaps(
  specs: SpecParseResult,
  acToDesignComponents: Map<string, string[]>,
  componentToACs: Map<string, string[]>,
  propertyToACs: Map<string, string[]>
): void {
  for (const specFile of specs.specFiles) {
    // Only process DESIGN files (they have components and cross-refs)
    if (specFile.componentNames.length === 0 && specFile.crossRefs.length === 0) {
      continue;
    }

    // Map cross-refs to the component they belong to.
    // Cross-refs appear after a component heading (### CODE-ComponentName).
    // We associate each cross-ref with the most recent component heading above it.
    const componentsByLine = specFile.componentNames
      .map((name) => ({
        name,
        line: specFile.idLocations?.get(name)?.line ?? 0,
      }))
      .sort((a, b) => a.line - b.line);

    for (const crossRef of specFile.crossRefs) {
      const ownerComponent = findOwnerComponent(componentsByLine, crossRef.line);

      if (crossRef.type === 'implements' && ownerComponent) {
        for (const acId of crossRef.ids) {
          pushToMap(acToDesignComponents, acId, ownerComponent);
          pushToMap(componentToACs, ownerComponent, acId);
        }
      }

      if (crossRef.type === 'validates') {
        // VALIDATES links a property to the ACs/requirements it validates.
        // We need to find the property this VALIDATES belongs to.
        // Properties appear as list items above the VALIDATES line in the same component.
        const ownerProperty = findOwnerProperty(specFile, crossRef.line);
        if (ownerProperty) {
          for (const acId of crossRef.ids) {
            pushToMap(propertyToACs, ownerProperty, acId);
          }
        }
      }
    }
  }
}

/** Build marker location maps. */
function buildMarkerMaps(
  markers: readonly CodeMarker[],
  acToCodeLocations: Map<string, CodeLocation[]>,
  acToTestLocations: Map<string, CodeLocation[]>,
  propertyToTestLocations: Map<string, CodeLocation[]>,
  componentToCodeLocations: Map<string, CodeLocation[]>
): void {
  for (const marker of markers) {
    const loc: CodeLocation = { filePath: marker.filePath, line: marker.line };

    switch (marker.type) {
      case 'impl':
        pushToMap(acToCodeLocations, marker.id, loc);
        break;
      case 'test':
        // Test markers can reference ACs or properties
        if (marker.id.includes('_P-')) {
          pushToMap(propertyToTestLocations, marker.id, loc);
        } else {
          pushToMap(acToTestLocations, marker.id, loc);
        }
        break;
      case 'component':
        pushToMap(componentToCodeLocations, marker.id, loc);
        break;
    }
  }
}

/** Extract parent requirement ID from an AC ID. e.g. DIFF-1_AC-1 → DIFF-1 */
function extractParentRequirement(acId: string): string | null {
  const idx = acId.indexOf('_AC-');
  return idx !== -1 ? acId.slice(0, idx) : null;
}

/** Find the component name that owns a given line (the most recent component heading above it). */
function findOwnerComponent(
  componentsByLine: readonly { name: string; line: number }[],
  line: number
): string | null {
  let owner: string | null = null;
  for (const comp of componentsByLine) {
    if (comp.line <= line) {
      owner = comp.name;
    } else {
      break;
    }
  }
  return owner;
}

/** Find the property ID that owns a VALIDATES cross-ref line. */
function findOwnerProperty(
  specFile: {
    readonly propertyIds: readonly string[];
    readonly idLocations?: ReadonlyMap<string, { filePath: string; line: number }>;
  },
  validateLine: number
): string | null {
  let owner: string | null = null;
  let closestLine = 0;
  for (const propId of specFile.propertyIds) {
    const loc = specFile.idLocations?.get(propId);
    if (loc && loc.line <= validateLine && loc.line > closestLine) {
      closestLine = loc.line;
      owner = propId;
    }
  }
  return owner;
}

/** Push a value into a map of arrays. */
function pushToMap<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const existing = map.get(key);
  if (existing) {
    existing.push(value);
  } else {
    map.set(key, [value]);
  }
}
