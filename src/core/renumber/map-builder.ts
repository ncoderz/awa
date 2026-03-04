// @awa-component: RENUM-MapBuilder
// @awa-impl: RENUM-1_AC-1, RENUM-1_AC-2, RENUM-1_AC-3
// @awa-impl: RENUM-2_AC-1, RENUM-2_AC-2
// @awa-impl: RENUM-3_AC-1, RENUM-3_AC-2
// @awa-impl: RENUM-4_AC-1, RENUM-4_AC-2

import { basename } from 'node:path';

import type { SpecFile, SpecParseResult } from '../check/types.js';
import type { MapBuildResult, RenumberMap } from './types.js';
import { RenumberError } from './types.js';

/**
 * Build a renumber map by walking REQ and DESIGN files in document order.
 * Assigns sequential numbers starting from 1 for requirements, subrequirements,
 * ACs, and properties.
 */
// @awa-impl: RENUM-1_AC-1
export function buildRenumberMap(code: string, specs: SpecParseResult): MapBuildResult {
  const reqFile = findSpecFile(specs.specFiles, code, 'REQ');
  if (!reqFile) {
    throw new RenumberError('CODE_NOT_FOUND', `No REQ file found for feature code: ${code}`);
  }

  const entries = new Map<string, string>();

  // Walk REQ file in document order for requirements, subrequirements, and ACs
  buildRequirementEntries(code, reqFile, entries);

  // Walk DESIGN file in document order for properties
  // @awa-impl: RENUM-4_AC-1, RENUM-4_AC-2
  const designFile = findSpecFile(specs.specFiles, code, 'DESIGN');
  if (designFile) {
    buildPropertyEntries(code, designFile, entries);
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
 * Build renumber entries for requirements, subrequirements, and ACs from a REQ file.
 */
// @awa-impl: RENUM-1_AC-2, RENUM-2_AC-1, RENUM-2_AC-2, RENUM-3_AC-1, RENUM-3_AC-2
function buildRequirementEntries(
  code: string,
  reqFile: SpecFile,
  entries: Map<string, string>,
): void {
  // Separate top-level requirements and subrequirements from document-order arrays
  const topLevelReqs: string[] = [];
  const subReqsByParent = new Map<string, string[]>();

  for (const id of reqFile.requirementIds) {
    if (id.includes('.')) {
      // Subrequirement: CODE-N.P
      const dotIdx = id.lastIndexOf('.');
      const parent = id.slice(0, dotIdx);
      const subs = subReqsByParent.get(parent) ?? [];
      subs.push(id);
      subReqsByParent.set(parent, subs);
    } else {
      topLevelReqs.push(id);
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
  for (const acId of reqFile.acIds) {
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
 * Build renumber entries for properties from a DESIGN file.
 */
function buildPropertyEntries(
  code: string,
  designFile: SpecFile,
  entries: Map<string, string>,
): void {
  for (let i = 0; i < designFile.propertyIds.length; i++) {
    const oldId = designFile.propertyIds[i] as string;
    const newNum = i + 1;
    const newId = `${code}_P-${newNum}`;
    entries.set(oldId, newId);
  }
}

/**
 * Find a spec file by feature code and file type prefix (REQ, DESIGN, etc.).
 */
function findSpecFile(
  specFiles: readonly SpecFile[],
  code: string,
  prefix: string,
): SpecFile | undefined {
  return specFiles.find((sf) => {
    const name = basename(sf.filePath);
    return name.startsWith(`${prefix}-${code}-`);
  });
}
