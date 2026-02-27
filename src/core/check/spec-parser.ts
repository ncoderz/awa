// @awa-component: CHK-SpecParser
// @awa-impl: CHK-2_AC-1
// @awa-impl: CHK-12_AC-1

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { collectFiles } from './glob.js';
import type { CheckConfig, CrossReference, SpecFile, SpecParseResult } from './types.js';

// @awa-impl: CHK-2_AC-1
export async function parseSpecs(config: CheckConfig): Promise<SpecParseResult> {
  const files = await collectSpecFiles(config.specGlobs, config.ignore);
  const specFiles: SpecFile[] = [];

  const requirementIds = new Set<string>();
  const acIds = new Set<string>();
  const propertyIds = new Set<string>();
  const componentNames = new Set<string>();
  const idLocations = new Map<string, { filePath: string; line: number }>();

  for (const filePath of files) {
    const specFile = await parseSpecFile(filePath, config.crossRefPatterns);
    if (specFile) {
      specFiles.push(specFile);
      for (const id of specFile.requirementIds) requirementIds.add(id);
      for (const id of specFile.acIds) acIds.add(id);
      for (const id of specFile.propertyIds) propertyIds.add(id);
      for (const name of specFile.componentNames) componentNames.add(name);
      // Merge id locations from parsed spec file
      for (const [id, loc] of specFile.idLocations ?? []) {
        idLocations.set(id, loc);
      }
    }
  }

  const allIds = new Set<string>([...requirementIds, ...acIds, ...propertyIds, ...componentNames]);

  return { requirementIds, acIds, propertyIds, componentNames, allIds, specFiles, idLocations };
}

async function parseSpecFile(
  filePath: string,
  crossRefPatterns: readonly string[]
): Promise<SpecFile | null> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }

  const code = extractCodePrefix(filePath);
  const lines = content.split('\n');

  const requirementIds: string[] = [];
  const acIds: string[] = [];
  const propertyIds: string[] = [];
  const componentNames: string[] = [];
  const crossRefs: CrossReference[] = [];
  const idLocations = new Map<string, { filePath: string; line: number }>();

  // Requirement ID: ### CODE-N: Title or ### CODE-N.P: Title
  const reqIdRegex = /^###\s+([A-Z][A-Z0-9]*-\d+(?:\.\d+)?)\s*:/;
  // AC ID: - [ ] CODE-N_AC-M or - [x] CODE-N.P_AC-M
  const acIdRegex = /^-\s+\[[ x]\]\s+([A-Z][A-Z0-9]*-\d+(?:\.\d+)?_AC-\d+)\s/;
  // Property ID: - CODE_P-N [Name]
  const propIdRegex = /^-\s+([A-Z][A-Z0-9]*_P-\d+)\s/;
  // Component name: ### CODE-ComponentName
  const componentRegex = /^###\s+([A-Z][A-Z0-9]*-[A-Za-z][A-Za-z0-9]*(?:[A-Z][a-z0-9]*)*)\s*$/;

  for (const [i, line] of lines.entries()) {
    const lineNum = i + 1;

    // Requirement IDs
    const reqMatch = reqIdRegex.exec(line);
    if (reqMatch?.[1]) {
      requirementIds.push(reqMatch[1]);
      idLocations.set(reqMatch[1], { filePath, line: lineNum });
    }

    // AC IDs
    const acMatch = acIdRegex.exec(line);
    if (acMatch?.[1]) {
      acIds.push(acMatch[1]);
      idLocations.set(acMatch[1], { filePath, line: lineNum });
    }

    // Property IDs
    const propMatch = propIdRegex.exec(line);
    if (propMatch?.[1]) {
      propertyIds.push(propMatch[1]);
      idLocations.set(propMatch[1], { filePath, line: lineNum });
    }

    // Component names (from DESIGN files)
    const compMatch = componentRegex.exec(line);
    if (compMatch?.[1]) {
      // Only count as component if it doesn't match requirement pattern
      if (!reqIdRegex.test(line)) {
        componentNames.push(compMatch[1]);
        idLocations.set(compMatch[1], { filePath, line: lineNum });
      }
    }

    // Cross-references (IMPLEMENTS:, VALIDATES:)
    for (const pattern of crossRefPatterns) {
      const patIdx = line.indexOf(pattern);
      if (patIdx !== -1) {
        const afterPattern = line.slice(patIdx + pattern.length);
        const ids = extractIdsFromText(afterPattern);
        if (ids.length > 0) {
          const type = pattern.toLowerCase().includes('implements') ? 'implements' : 'validates';
          crossRefs.push({ type, ids, filePath, line: i + 1 });
        }
      }
    }
  }

  return {
    filePath,
    code,
    requirementIds,
    acIds,
    propertyIds,
    componentNames,
    crossRefs,
    idLocations,
  };
}

function extractCodePrefix(filePath: string): string {
  const name = basename(filePath, '.md');
  // Extract CODE from patterns like REQ-CODE-feature, DESIGN-CODE-feature, FEAT-CODE-feature
  const match = /^(?:REQ|DESIGN|FEAT|EXAMPLES|API)-([A-Z][A-Z0-9]*)-/.exec(name);
  if (match?.[1]) return match[1];
  // Fallback: ARCHITECTURE.md has no code prefix
  return '';
}

function extractIdsFromText(text: string): string[] {
  const idRegex = /[A-Z][A-Z0-9]*-\d+(?:\.\d+)?(?:_AC-\d+)?|[A-Z][A-Z0-9]*_P-\d+/g;
  const ids: string[] = [];
  let match = idRegex.exec(text);
  while (match !== null) {
    ids.push(match[0]);
    match = idRegex.exec(text);
  }
  return ids;
}

// @awa-impl: CHK-12_AC-1
async function collectSpecFiles(
  specGlobs: readonly string[],
  ignore: readonly string[]
): Promise<string[]> {
  return collectFiles(specGlobs, ignore);
}
