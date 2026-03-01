// @awa-component: TRC-TraceResolver
// @awa-impl: TRC-3_AC-1, TRC-3_AC-2, TRC-3_AC-3, TRC-3_AC-4, TRC-3_AC-5, TRC-11_AC-1, TRC-11_AC-2

import type { TraceChain, TraceIndex, TraceNode, TraceOptions, TraceResult } from './types.js';

/**
 * Resolve trace chains for a set of IDs against the TraceIndex.
 * Returns a TraceResult with chains for found IDs and a list of not-found IDs.
 */
export function resolveTrace(
  index: TraceIndex,
  ids: readonly string[],
  options: TraceOptions
): TraceResult {
  const chains: TraceChain[] = [];
  const notFound: string[] = [];

  for (const id of ids) {
    if (!index.allIds.has(id)) {
      notFound.push(id);
      continue;
    }

    const chain = resolveChain(index, id, options);
    if (chain) {
      chains.push(chain);
    }
  }

  return { chains, notFound };
}

/** Resolve a single trace chain for one ID. */
function resolveChain(index: TraceIndex, id: string, options: TraceOptions): TraceChain | null {
  const idType = detectIdType(id);
  const scope = options.scope;

  let requirement: TraceNode | undefined;
  let acs: TraceNode[] = [];
  let designComponents: TraceNode[] = [];
  let implementations: TraceNode[] = [];
  let tests: TraceNode[] = [];
  let properties: TraceNode[] = [];

  switch (idType) {
    case 'requirement':
      resolveFromRequirement(index, id, options, {
        requirement: (n) => {
          requirement = n;
        },
        acs,
        designComponents,
        implementations,
        tests,
        properties,
      });
      break;
    case 'ac':
      resolveFromAC(index, id, options, {
        requirement: (n) => {
          requirement = n;
        },
        acs,
        designComponents,
        implementations,
        tests,
        properties,
      });
      break;
    case 'property':
      resolveFromProperty(index, id, options, {
        requirement: (n) => {
          requirement = n;
        },
        acs,
        designComponents,
        implementations,
        tests,
        properties,
      });
      break;
    case 'component':
      resolveFromComponent(index, id, options, {
        requirement: (n) => {
          requirement = n;
        },
        acs,
        designComponents,
        implementations,
        tests,
        properties,
      });
      break;
  }

  // Apply scope filtering
  if (scope) {
    acs = acs.filter((n) => n.id.startsWith(scope));
    designComponents = designComponents.filter((n) => n.id.startsWith(scope));
    implementations = implementations.filter((n) => matchesScope(n, scope, index));
    tests = tests.filter((n) => matchesScope(n, scope, index));
    properties = properties.filter((n) => n.id.startsWith(scope));
    if (requirement && !requirement.id.startsWith(scope)) {
      requirement = undefined;
    }
  }

  // Apply layer filtering
  if (options.noCode) {
    implementations = [];
  }
  if (options.noTests) {
    tests = [];
    properties = [];
  }

  return {
    queryId: id,
    requirement,
    acs: deduplicateNodes(acs),
    designComponents: deduplicateNodes(designComponents),
    implementations: deduplicateNodes(implementations),
    tests: deduplicateNodes(tests),
    properties: deduplicateNodes(properties),
  };
}

/** Collectors for building a chain incrementally. */
interface ChainCollectors {
  requirement: (node: TraceNode) => void;
  acs: TraceNode[];
  designComponents: TraceNode[];
  implementations: TraceNode[];
  tests: TraceNode[];
  properties: TraceNode[];
}

/** Resolve starting from a requirement ID. */
function resolveFromRequirement(
  index: TraceIndex,
  reqId: string,
  options: TraceOptions,
  collectors: ChainCollectors
): void {
  const loc = index.idLocations.get(reqId);
  if (loc) {
    collectors.requirement({ id: reqId, type: 'requirement', location: loc });
  }

  if (options.direction === 'reverse') return;

  // Forward: requirement → ACs → design → code → tests
  const acIds = index.reqToACs.get(reqId) ?? [];
  for (const acId of acIds) {
    const acLoc = index.idLocations.get(acId);
    if (acLoc) {
      collectors.acs.push({ id: acId, type: 'ac', location: acLoc });
    }
    if (withinDepth(options.depth, 1)) {
      resolveACDownstream(index, acId, options, collectors, 1);
    }
  }
}

/** Resolve starting from an AC ID. */
function resolveFromAC(
  index: TraceIndex,
  acId: string,
  options: TraceOptions,
  collectors: ChainCollectors
): void {
  const acLoc = index.idLocations.get(acId);
  if (acLoc) {
    collectors.acs.push({ id: acId, type: 'ac', location: acLoc });
  }

  // Reverse: AC → requirement
  if (options.direction !== 'forward') {
    const reqId = index.acToReq.get(acId);
    if (reqId) {
      const reqLoc = index.idLocations.get(reqId);
      if (reqLoc) {
        collectors.requirement({ id: reqId, type: 'requirement', location: reqLoc });
      }
    }
  }

  // Forward: AC → design → code → tests
  if (options.direction !== 'reverse') {
    resolveACDownstream(index, acId, options, collectors, 0);
  }
}

/** Resolve starting from a property ID. */
function resolveFromProperty(
  index: TraceIndex,
  propId: string,
  options: TraceOptions,
  collectors: ChainCollectors
): void {
  const propLoc = index.idLocations.get(propId);
  if (propLoc) {
    collectors.properties.push({ id: propId, type: 'property', location: propLoc });
  }

  // Forward: property → test locations
  if (options.direction !== 'reverse') {
    const testLocs = index.propertyToTestLocations.get(propId) ?? [];
    for (const loc of testLocs) {
      collectors.tests.push({ id: propId, type: 'test', location: loc });
    }
  }

  // Reverse: property → ACs it validates → requirements
  if (options.direction !== 'forward') {
    const acIds = index.propertyToACs.get(propId) ?? [];
    for (const acId of acIds) {
      const acLoc = index.idLocations.get(acId);
      if (acLoc) {
        collectors.acs.push({ id: acId, type: 'ac', location: acLoc });
      }
      if (withinDepth(options.depth, 1)) {
        const reqId = index.acToReq.get(acId);
        if (reqId) {
          const reqLoc = index.idLocations.get(reqId);
          if (reqLoc) {
            collectors.requirement({ id: reqId, type: 'requirement', location: reqLoc });
          }
        }
      }
    }
  }
}

/** Resolve starting from a component name. */
function resolveFromComponent(
  index: TraceIndex,
  componentId: string,
  options: TraceOptions,
  collectors: ChainCollectors
): void {
  const compLoc = index.idLocations.get(componentId);
  if (compLoc) {
    collectors.designComponents.push({ id: componentId, type: 'component', location: compLoc });
  }

  // Forward: component → code locations
  if (options.direction !== 'reverse') {
    const codeLocs = index.componentToCodeLocations.get(componentId) ?? [];
    for (const loc of codeLocs) {
      collectors.implementations.push({
        id: componentId,
        type: 'implementation',
        location: loc,
      });
    }
  }

  // Reverse: component → ACs → requirements
  if (options.direction !== 'forward') {
    const acIds = index.componentToACs.get(componentId) ?? [];
    for (const acId of acIds) {
      const acLoc = index.idLocations.get(acId);
      if (acLoc) {
        collectors.acs.push({ id: acId, type: 'ac', location: acLoc });
      }
      if (withinDepth(options.depth, 1)) {
        const reqId = index.acToReq.get(acId);
        if (reqId) {
          const reqLoc = index.idLocations.get(reqId);
          if (reqLoc) {
            collectors.requirement({ id: reqId, type: 'requirement', location: reqLoc });
          }
        }
      }
    }
  }
}

/** Resolve the downstream portion of an AC: design components → code → tests. */
function resolveACDownstream(
  index: TraceIndex,
  acId: string,
  options: TraceOptions,
  collectors: ChainCollectors,
  currentDepth: number
): void {
  // AC → design components
  const components = index.acToDesignComponents.get(acId) ?? [];
  for (const comp of components) {
    const compLoc = index.idLocations.get(comp);
    if (compLoc) {
      collectors.designComponents.push({ id: comp, type: 'component', location: compLoc });
    }
  }

  if (!withinDepth(options.depth, currentDepth + 1)) return;

  // AC → code locations (@awa-impl)
  const codeLocs = index.acToCodeLocations.get(acId) ?? [];
  for (const loc of codeLocs) {
    collectors.implementations.push({ id: acId, type: 'implementation', location: loc });
  }

  // AC → test locations (@awa-test)
  const testLocs = index.acToTestLocations.get(acId) ?? [];
  for (const loc of testLocs) {
    collectors.tests.push({ id: acId, type: 'test', location: loc });
  }
}

/** Detect the type of a traceability ID. */
export function detectIdType(id: string): 'requirement' | 'ac' | 'property' | 'component' {
  if (id.includes('_AC-')) return 'ac';
  if (id.includes('_P-')) return 'property';
  // Requirements: CODE-N or CODE-N.P (contain a digit after the dash)
  if (/^[A-Z][A-Z0-9]*-\d+/.test(id)) return 'requirement';
  // Component names: CODE-PascalCaseName
  return 'component';
}

/** Check if we're within depth limit. */
function withinDepth(maxDepth: number | undefined, current: number): boolean {
  if (maxDepth === undefined) return true;
  return current < maxDepth;
}

/** Check if a node's associated IDs match the scope code. */
function matchesScope(node: TraceNode, scope: string, _index: TraceIndex): boolean {
  return node.id.startsWith(scope);
}

/** Deduplicate nodes by id + location. */
function deduplicateNodes(nodes: readonly TraceNode[]): TraceNode[] {
  const seen = new Set<string>();
  const result: TraceNode[] = [];
  for (const node of nodes) {
    const key = `${node.id}:${node.location.filePath}:${node.location.line}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(node);
    }
  }
  return result;
}
