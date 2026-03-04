// @awa-component: RCOD-RecodeMapBuilder
// @awa-impl: RCOD-1_AC-1, RCOD-1_AC-2, RCOD-1_AC-3, RCOD-1_AC-4, RCOD-1_AC-5

import type { SpecFile, SpecParseResult } from '../check/types.js';
import type { RenumberMap } from '../renumber/types.js';
import { findSpecFiles, hasAnySpecFile } from '../spec-file-utils.js';
import { RecodeError } from './types.js';

/**
 * Result of building a recode map.
 */
export interface RecodeMapBuildResult {
  readonly map: RenumberMap;
  readonly noChange: boolean;
}

/**
 * Build a recode map that translates IDs from sourceCode to targetCode,
 * with numbers offset past the highest existing target numbers.
 * Iterates ALL matching files for each code+prefix pair.
 */
// @awa-impl: RCOD-1_AC-1
export function buildRecodeMap(
  sourceCode: string,
  targetCode: string,
  specs: SpecParseResult,
): RecodeMapBuildResult {
  // Validate that at least one spec file exists for the source code
  if (!hasAnySpecFile(specs.specFiles, sourceCode)) {
    throw new RecodeError('SOURCE_NOT_FOUND', `No spec files found for source code: ${sourceCode}`);
  }

  const entries = new Map<string, string>();

  // Walk ALL source REQ files in document order, mapping IDs with offset
  const sourceReqs = findSpecFiles(specs.specFiles, sourceCode, 'REQ');
  if (sourceReqs.length > 0) {
    const targetReqs = findSpecFiles(specs.specFiles, targetCode, 'REQ');
    const reqOffset = findHighestReqNumber(targetReqs);
    buildRequirementEntries(sourceCode, targetCode, sourceReqs, reqOffset, entries);
  }

  // Handle properties: find highest target property number across ALL target DESIGN files
  // @awa-impl: RCOD-1_AC-4
  const sourceDesigns = findSpecFiles(specs.specFiles, sourceCode, 'DESIGN');
  const targetDesigns = findSpecFiles(specs.specFiles, targetCode, 'DESIGN');
  if (sourceDesigns.length > 0) {
    const propOffset = findHighestPropertyNumber(targetDesigns);
    buildPropertyEntries(sourceCode, targetCode, sourceDesigns, propOffset, entries);
  }

  // Handle component name prefix rewriting across ALL source DESIGN files
  // @awa-impl: RCOD-1_AC-5
  if (sourceDesigns.length > 0) {
    buildComponentEntries(sourceCode, targetCode, sourceDesigns, entries);
  }

  const noChange = entries.size === 0;
  const map: RenumberMap = { code: sourceCode, entries };
  return { map, noChange };
}

/**
 * Build recode entries for requirements, subrequirements, and ACs from all source REQ files.
 */
// @awa-impl: RCOD-1_AC-1, RCOD-1_AC-2, RCOD-1_AC-3
function buildRequirementEntries(
  _sourceCode: string,
  targetCode: string,
  sourceReqs: readonly SpecFile[],
  reqOffset: number,
  entries: Map<string, string>,
): void {
  // Collect all requirements and ACs across files in order
  const topLevelReqs: string[] = [];
  const subReqsByParent = new Map<string, string[]>();
  const allAcIds: string[] = [];

  for (const sourceReq of sourceReqs) {
    for (const id of sourceReq.requirementIds) {
      if (id.includes('.')) {
        const dotIdx = id.lastIndexOf('.');
        const parent = id.slice(0, dotIdx);
        const subs = subReqsByParent.get(parent) ?? [];
        subs.push(id);
        subReqsByParent.set(parent, subs);
      } else {
        topLevelReqs.push(id);
      }
    }
    for (const acId of sourceReq.acIds) {
      allAcIds.push(acId);
    }
  }

  // Map top-level requirements with offset
  const reqNumberMap = new Map<string, number>(); // old source req ID → new target number
  for (let i = 0; i < topLevelReqs.length; i++) {
    const oldId = topLevelReqs[i] as string;
    const newNum = reqOffset + i + 1;
    const newId = `${targetCode}-${newNum}`;
    entries.set(oldId, newId);
    reqNumberMap.set(oldId, newNum);
  }

  // Map subrequirements: preserve subreq numbering, update parent prefix
  // @awa-impl: RCOD-1_AC-2
  for (const oldParentId of topLevelReqs) {
    const subs = subReqsByParent.get(oldParentId);
    if (!subs) continue;

    const newParentNum = reqNumberMap.get(oldParentId);
    if (newParentNum === undefined) continue;

    for (let j = 0; j < subs.length; j++) {
      const oldSubId = subs[j] as string;
      const newSubNum = j + 1;
      const newSubId = `${targetCode}-${newParentNum}.${newSubNum}`;
      entries.set(oldSubId, newSubId);
    }
  }

  // Map ACs: group by parent, update parent prefix
  // @awa-impl: RCOD-1_AC-3
  const acsByParent = new Map<string, string[]>();
  for (const acId of allAcIds) {
    const parent = acId.split('_AC-')[0] as string;
    const acs = acsByParent.get(parent) ?? [];
    acs.push(acId);
    acsByParent.set(parent, acs);
  }

  for (const [oldParentId, acs] of acsByParent) {
    const newParentId = entries.get(oldParentId) ?? oldParentId;
    for (let k = 0; k < acs.length; k++) {
      const oldAcId = acs[k] as string;
      const newAcNum = k + 1;
      const newAcId = `${newParentId}_AC-${newAcNum}`;
      entries.set(oldAcId, newAcId);
    }
  }
}

/**
 * Build recode entries for properties with offset from all source DESIGN files.
 */
function buildPropertyEntries(
  _sourceCode: string,
  targetCode: string,
  sourceDesigns: readonly SpecFile[],
  propOffset: number,
  entries: Map<string, string>,
): void {
  let counter = 0;
  for (const sourceDesign of sourceDesigns) {
    for (const oldId of sourceDesign.propertyIds) {
      counter++;
      const newId = `${targetCode}_P-${propOffset + counter}`;
      entries.set(oldId, newId);
    }
  }
}

/**
 * Build recode entries for component name prefixes from all source DESIGN files.
 */
function buildComponentEntries(
  sourceCode: string,
  targetCode: string,
  sourceDesigns: readonly SpecFile[],
  entries: Map<string, string>,
): void {
  for (const sourceDesign of sourceDesigns) {
    for (const compName of sourceDesign.componentNames) {
      const prefix = `${sourceCode}-`;
      if (compName.startsWith(prefix)) {
        const suffix = compName.slice(prefix.length);
        entries.set(compName, `${targetCode}-${suffix}`);
      }
    }
  }
}

/**
 * Find the highest top-level requirement number across all given REQ files.
 * Returns 0 if no requirements exist.
 */
function findHighestReqNumber(reqFiles: readonly SpecFile[]): number {
  let max = 0;
  for (const reqFile of reqFiles) {
    for (const id of reqFile.requirementIds) {
      if (id.includes('.')) continue; // skip subrequirements
      const match = id.match(/-(\d+)$/);
      if (match) {
        const num = Number.parseInt(match[1] as string, 10);
        if (num > max) max = num;
      }
    }
  }
  return max;
}

/**
 * Find the highest property number across all given DESIGN files.
 * Returns 0 if no properties exist.
 */
function findHighestPropertyNumber(designFiles: readonly SpecFile[]): number {
  let max = 0;
  for (const designFile of designFiles) {
    for (const id of designFile.propertyIds) {
      const match = id.match(/_P-(\d+)$/);
      if (match) {
        const num = Number.parseInt(match[1] as string, 10);
        if (num > max) max = num;
      }
    }
  }
  return max;
}
