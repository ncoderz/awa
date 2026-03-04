// @awa-component: RENUM-MapBuilder
// @awa-impl: RENUM-1_AC-1, RENUM-1_AC-2, RENUM-1_AC-3
// @awa-impl: RENUM-2_AC-1, RENUM-2_AC-2
// @awa-impl: RENUM-3_AC-1, RENUM-3_AC-2
// @awa-impl: RENUM-4_AC-1, RENUM-4_AC-2

import type { SpecFile, SpecParseResult } from '../check/types.js';
import { findSpecFiles } from '../spec-file-utils.js';
import type { MapBuildResult, RenumberMap } from './types.js';
import { RenumberError } from './types.js';

/**
 * Build a renumber map by walking ALL REQ and DESIGN files in document order.
 * Files are sorted alphabetically by basename. Requirements and properties are
 * numbered globally across all files for the feature code.
 */
// @awa-impl: RENUM-1_AC-1
export function buildRenumberMap(code: string, specs: SpecParseResult): MapBuildResult {
  const reqFiles = findSpecFiles(specs.specFiles, code, 'REQ');
  if (reqFiles.length === 0) {
    throw new RenumberError('CODE_NOT_FOUND', `No REQ file found for feature code: ${code}`);
  }

  const entries = new Map<string, string>();

  // Walk ALL REQ files in alphabetical order for requirements, subrequirements, and ACs
  buildRequirementEntries(code, reqFiles, entries);

  // Walk ALL DESIGN files in alphabetical order for properties
  // @awa-impl: RENUM-4_AC-1, RENUM-4_AC-2
  const designFiles = findSpecFiles(specs.specFiles, code, 'DESIGN');
  if (designFiles.length > 0) {
    buildPropertyEntries(code, designFiles, entries);
  }
  // If no DESIGN file exists, skip property renumbering without error (RENUM-4_AC-2)

  // Remove identity mappings (old === new)
  for (const [oldId, newId] of entries) {
    if (oldId === newId) {
      entries.delete(oldId);
    }
  }

  // @awa-impl: RENUM-1_AC-3
  const noChange = entries.size === 0;

  const map: RenumberMap = { code, entries };
  return { map, noChange };
}

/**
 * Build renumber entries for requirements, subrequirements, and ACs from all REQ files.
 * Files are processed in the order given (already sorted alphabetically).
 * IDs are numbered globally across all files.
 */
// @awa-impl: RENUM-1_AC-2, RENUM-2_AC-1, RENUM-2_AC-2, RENUM-3_AC-1, RENUM-3_AC-2
function buildRequirementEntries(
  code: string,
  reqFiles: readonly SpecFile[],
  entries: Map<string, string>,
): void {
  // Collect all requirements and subrequirements across files in order
  const topLevelReqs: string[] = [];
  const subReqsByParent = new Map<string, string[]>();
  const allAcIds: string[] = [];

  for (const reqFile of reqFiles) {
    for (const id of reqFile.requirementIds) {
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
    for (const acId of reqFile.acIds) {
      allAcIds.push(acId);
    }
  }

  // Build old→new mapping for top-level requirements
  const reqNumberMap = new Map<string, number>(); // old req ID → new number
  for (let i = 0; i < topLevelReqs.length; i++) {
    const oldId = topLevelReqs[i] as string;
    const newNum = i + 1;
    const newId = `${code}-${newNum}`;
    entries.set(oldId, newId);
    reqNumberMap.set(oldId, newNum);
  }

  // Build old→new mapping for subrequirements within each parent
  for (const oldParentId of topLevelReqs) {
    const subs = subReqsByParent.get(oldParentId);
    if (!subs) continue;

    const newParentNum = reqNumberMap.get(oldParentId);
    if (newParentNum === undefined) continue;

    for (let j = 0; j < subs.length; j++) {
      const oldSubId = subs[j] as string;
      const newSubNum = j + 1;
      const newSubId = `${code}-${newParentNum}.${newSubNum}`;
      entries.set(oldSubId, newSubId);
    }
  }

  // Build AC mapping: group ACs by their parent (req or subreq)
  const acsByParent = new Map<string, string[]>();
  for (const acId of allAcIds) {
    const parent = acId.split('_AC-')[0] as string;
    const acs = acsByParent.get(parent) ?? [];
    acs.push(acId);
    acsByParent.set(parent, acs);
  }

  // Renumber ACs within each parent
  for (const [oldParentId, acs] of acsByParent) {
    // Determine the new parent ID
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
 * Build renumber entries for properties from all DESIGN files.
 * Files are processed in the order given (already sorted alphabetically).
 * Properties are numbered globally across all files.
 */
function buildPropertyEntries(
  code: string,
  designFiles: readonly SpecFile[],
  entries: Map<string, string>,
): void {
  let counter = 0;
  for (const designFile of designFiles) {
    for (const oldId of designFile.propertyIds) {
      counter++;
      const newId = `${code}_P-${counter}`;
      entries.set(oldId, newId);
    }
  }
}
