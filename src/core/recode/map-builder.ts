// @awa-component: RCOD-RecodeMapBuilder
// @awa-impl: RCOD-1_AC-1, RCOD-1_AC-2, RCOD-1_AC-3, RCOD-1_AC-4, RCOD-1_AC-5

import { basename } from 'node:path';

import type { SpecFile, SpecParseResult } from '../check/types.js';
import type { RenumberMap } from '../renumber/types.js';
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
 */
// @awa-impl: RCOD-1_AC-1
export function buildRecodeMap(
  sourceCode: string,
  targetCode: string,
  specs: SpecParseResult
): RecodeMapBuildResult {
  // Validate that at least one spec file exists for the source code
  if (!hasAnySpecFile(specs.specFiles, sourceCode)) {
    throw new RecodeError('SOURCE_NOT_FOUND', `No spec files found for source code: ${sourceCode}`);
  }

  const entries = new Map<string, string>();

  // Walk source REQ file in document order, mapping IDs with offset (if REQ files exist)
  const sourceReq = findSpecFile(specs.specFiles, sourceCode, 'REQ');
  if (sourceReq) {
    const targetReq = findSpecFile(specs.specFiles, targetCode, 'REQ');
    const reqOffset = targetReq ? findHighestReqNumber(targetReq) : 0;
    buildRequirementEntries(sourceCode, targetCode, sourceReq, reqOffset, entries);
  }

  // Handle properties: find highest target property number, map source properties
  // @awa-impl: RCOD-1_AC-4
  const sourceDesign = findSpecFile(specs.specFiles, sourceCode, 'DESIGN');
  const targetDesign = findSpecFile(specs.specFiles, targetCode, 'DESIGN');
  if (sourceDesign) {
    const propOffset = targetDesign ? findHighestPropertyNumber(targetDesign) : 0;
    buildPropertyEntries(sourceCode, targetCode, sourceDesign, propOffset, entries);
  }

  // Handle component name prefix rewriting
  // @awa-impl: RCOD-1_AC-5
  if (sourceDesign) {
    buildComponentEntries(sourceCode, targetCode, sourceDesign, entries);
  }

  const noChange = entries.size === 0;
  const map: RenumberMap = { code: sourceCode, entries };
  return { map, noChange };
}

/**
 * Build recode entries for requirements, subrequirements, and ACs.
 */
// @awa-impl: RCOD-1_AC-1, RCOD-1_AC-2, RCOD-1_AC-3
function buildRequirementEntries(
  _sourceCode: string,
  targetCode: string,
  sourceReq: SpecFile,
  reqOffset: number,
  entries: Map<string, string>
): void {
  // Separate top-level requirements and subrequirements
  const topLevelReqs: string[] = [];
  const subReqsByParent = new Map<string, string[]>();

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
  for (const acId of sourceReq.acIds) {
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
 * Build recode entries for properties with offset.
 */
function buildPropertyEntries(
  _sourceCode: string,
  targetCode: string,
  sourceDesign: SpecFile,
  propOffset: number,
  entries: Map<string, string>
): void {
  for (let i = 0; i < sourceDesign.propertyIds.length; i++) {
    const oldId = sourceDesign.propertyIds[i] as string;
    const newNum = propOffset + i + 1;
    const newId = `${targetCode}_P-${newNum}`;
    entries.set(oldId, newId);
  }
}

/**
 * Build recode entries for component name prefixes.
 */
function buildComponentEntries(
  sourceCode: string,
  targetCode: string,
  sourceDesign: SpecFile,
  entries: Map<string, string>
): void {
  for (const compName of sourceDesign.componentNames) {
    // Component names follow CODE-PascalCaseName pattern
    const prefix = `${sourceCode}-`;
    if (compName.startsWith(prefix)) {
      const suffix = compName.slice(prefix.length);
      entries.set(compName, `${targetCode}-${suffix}`);
    }
  }
}

/**
 * Find the highest top-level requirement number in a REQ file.
 * Returns 0 if no requirements exist.
 */
function findHighestReqNumber(reqFile: SpecFile): number {
  let max = 0;
  for (const id of reqFile.requirementIds) {
    if (id.includes('.')) continue; // skip subrequirements
    const match = id.match(/-(\d+)$/);
    if (match) {
      const num = Number.parseInt(match[1] as string, 10);
      if (num > max) max = num;
    }
  }
  return max;
}

/**
 * Find the highest property number in a DESIGN file.
 * Returns 0 if no properties exist.
 */
function findHighestPropertyNumber(designFile: SpecFile): number {
  let max = 0;
  for (const id of designFile.propertyIds) {
    const match = id.match(/_P-(\d+)$/);
    if (match) {
      const num = Number.parseInt(match[1] as string, 10);
      if (num > max) max = num;
    }
  }
  return max;
}

/**
 * Find a spec file by feature code and file type prefix.
 */
function findSpecFile(
  specFiles: readonly SpecFile[],
  code: string,
  prefix: string
): SpecFile | undefined {
  return specFiles.find((sf) => {
    const name = basename(sf.filePath);
    return name.startsWith(`${prefix}-${code}-`);
  });
}

/** Known spec file prefixes that carry a feature code. */
const SPEC_PREFIXES = ['FEAT', 'REQ', 'DESIGN', 'EXAMPLE', 'API', 'TASK'] as const;

/**
 * Check whether at least one spec file exists for the given feature code.
 */
export function hasAnySpecFile(specFiles: readonly SpecFile[], code: string): boolean {
  return specFiles.some((sf) => {
    const name = basename(sf.filePath);
    return SPEC_PREFIXES.some((prefix) => name.startsWith(`${prefix}-${code}-`));
  });
}
