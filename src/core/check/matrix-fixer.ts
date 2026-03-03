// @awa-component: CLI-MatrixFixer
// @awa-impl: CLI-38_AC-1
// @awa-impl: CLI-38_AC-2

import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { SpecFile, SpecParseResult } from './types.js';

// --- Public API ---

export interface FixResult {
  readonly filesFixed: number;
  readonly fileResults: readonly FileFixResult[];
}

export interface FileFixResult {
  readonly filePath: string;
  readonly changed: boolean;
}

/**
 * Regenerate "Requirements Traceability" sections in all DESIGN and TASK files.
 * Returns the number of files that were actually modified.
 */
export async function fixMatrices(
  specs: SpecParseResult,
  crossRefPatterns: readonly string[]
): Promise<FixResult> {
  const reqFileMaps = buildReqFileMaps(specs.specFiles);
  const fileResults: FileFixResult[] = [];

  for (const specFile of specs.specFiles) {
    const fileName = basename(specFile.filePath);

    if (fileName.startsWith('DESIGN-')) {
      const changed = await fixDesignMatrix(specFile.filePath, reqFileMaps, crossRefPatterns, specFile.content);
      fileResults.push({ filePath: specFile.filePath, changed });
    } else if (fileName.startsWith('TASK-')) {
      const changed = await fixTaskMatrix(specFile.filePath, reqFileMaps, specs, crossRefPatterns, specFile.content);
      fileResults.push({ filePath: specFile.filePath, changed });
    }
  }

  return {
    filesFixed: fileResults.filter((r) => r.changed).length,
    fileResults,
  };
}

// --- ID → REQ filename maps ---

interface ReqFileMaps {
  /** Maps each requirement ID and AC ID to the REQ file that defines it. */
  readonly idToReqFile: Map<string, string>;
  /** Maps code prefix to sorted list of REQ filenames (fallback for property IDs). */
  readonly codeToReqFiles: Map<string, string[]>;
}

/**
 * Build maps from requirement/AC IDs and code prefixes to REQ filenames.
 * The per-ID map correctly handles multiple REQ files sharing the same code
 * prefix (e.g. REQ-ARC-flows.md and REQ-ARC-security.md both using ARC-* IDs).
 */
function buildReqFileMaps(specFiles: readonly SpecFile[]): ReqFileMaps {
  const idToReqFile = new Map<string, string>();
  const codeToReqFilesSet = new Map<string, Set<string>>();

  for (const sf of specFiles) {
    const fileName = basename(sf.filePath);
    if (!/\bREQ-/.test(fileName)) continue;

    // Map each requirement ID and AC ID to this REQ file
    for (const reqId of sf.requirementIds) {
      idToReqFile.set(reqId, fileName);
    }
    for (const acId of sf.acIds) {
      idToReqFile.set(acId, fileName);
    }

    // Build code → REQ files multimap for property ID fallback
    if (sf.code) {
      const existing = codeToReqFilesSet.get(sf.code) ?? new Set<string>();
      existing.add(fileName);
      codeToReqFilesSet.set(sf.code, existing);
    }
  }

  // Convert sets to sorted arrays for deterministic output
  const codeToReqFiles = new Map<string, string[]>();
  for (const [code, files] of codeToReqFilesSet) {
    codeToReqFiles.set(code, [...files].sort());
  }

  return { idToReqFile, codeToReqFiles };
}

/**
 * Resolve an ID to its REQ file.
 * - Requirement IDs and AC IDs: direct lookup via idToReqFile
 * - AC IDs not found directly: strip _AC-N suffix and look up parent requirement
 * - Property IDs (CODE_P-N): code prefix fallback via codeToReqFiles
 *   (when one REQ file for the code, it's unambiguous; with multiple, uses first sorted)
 */
function resolveReqFile(id: string, maps: ReqFileMaps): string | undefined {
  // Direct lookup (works for both requirement IDs and AC IDs)
  const direct = maps.idToReqFile.get(id);
  if (direct) return direct;

  // For AC IDs, try parent requirement: strip _AC-N suffix
  const acMatch = /^(.+)_AC-\d+$/.exec(id);
  if (acMatch?.[1]) {
    return maps.idToReqFile.get(acMatch[1]);
  }

  // For property IDs (CODE_P-N), fall back to code prefix
  const propMatch = /^([A-Z][A-Z0-9]*)_P-\d+$/.exec(id);
  if (propMatch?.[1]) {
    const files = maps.codeToReqFiles.get(propMatch[1]);
    return files?.[0];
  }

  return undefined;
}

// --- DESIGN matrix ---

interface ComponentInfo {
  readonly name: string;
  readonly implements: string[];
}

interface PropertyInfo {
  readonly id: string;
  readonly validates: string[];
}

async function fixDesignMatrix(
  filePath: string,
  reqFileMaps: ReqFileMaps,
  crossRefPatterns: readonly string[],
  cachedContent?: string
): Promise<boolean> {
  let content: string;
  if (cachedContent != null) {
    content = cachedContent;
  } else {
    try {
      content = await readFile(filePath, 'utf-8');
    } catch {
      return false;
    }
  }

  const { components, properties } = parseDesignFileData(content, crossRefPatterns);

  // AC → component names
  const acToComponents = new Map<string, string[]>();
  for (const comp of components) {
    for (const acId of comp.implements) {
      const existing = acToComponents.get(acId) ?? [];
      existing.push(comp.name);
      acToComponents.set(acId, existing);
    }
  }

  // AC → property IDs (from VALIDATES)
  const acToProperties = new Map<string, string[]>();
  for (const prop of properties) {
    for (const acId of prop.validates) {
      const existing = acToProperties.get(acId) ?? [];
      existing.push(prop.id);
      acToProperties.set(acId, existing);
    }
  }

  // Group ACs by REQ file
  const allAcIds = [...acToComponents.keys()];
  const grouped = groupByReqFile(allAcIds, reqFileMaps);

  const newSection = generateDesignSection(grouped, acToComponents, acToProperties);
  const newContent = replaceTraceabilitySection(content, newSection);
  if (newContent === content) return false;

  await writeFile(filePath, newContent, 'utf-8');
  return true;
}

function parseDesignFileData(
  content: string,
  crossRefPatterns: readonly string[]
): { components: ComponentInfo[]; properties: PropertyInfo[] } {
  const lines = content.split('\n');
  const components: ComponentInfo[] = [];
  const properties: PropertyInfo[] = [];

  const componentRegex = /^###\s+([A-Z][A-Z0-9]*-[A-Za-z][A-Za-z0-9]*(?:[A-Z][a-z0-9]*)*)\s*$/;
  const reqIdRegex = /^###\s+([A-Z][A-Z0-9]*-\d+(?:\.\d+)?)\s*:/;
  const propIdRegex = /^-\s+([A-Z][A-Z0-9]*_P-\d+)\s/;

  let currentComponent: string | null = null;
  let lastPropertyId: string | null = null;

  for (const line of lines) {
    // Component heading
    const compMatch = componentRegex.exec(line);
    if (compMatch?.[1] && !reqIdRegex.test(line)) {
      currentComponent = compMatch[1];
      lastPropertyId = null;
      components.push({ name: currentComponent, implements: [] });
      continue;
    }

    // H1/H2 heading resets context
    if (/^#{1,2}\s/.test(line) && !compMatch) {
      currentComponent = null;
      lastPropertyId = null;
      continue;
    }

    // Property ID
    const propMatch = propIdRegex.exec(line);
    if (propMatch?.[1]) {
      lastPropertyId = propMatch[1];
      properties.push({ id: lastPropertyId, validates: [] });
      continue;
    }

    // Cross-references
    for (const pattern of crossRefPatterns) {
      const patIdx = line.indexOf(pattern);
      if (patIdx !== -1) {
        const afterPattern = line.slice(patIdx + pattern.length);
        const ids = extractIdsFromText(afterPattern);
        if (ids.length > 0) {
          const isImplements = pattern.toLowerCase().includes('implements');
          if (isImplements && currentComponent) {
            const comp = components.find((c) => c.name === currentComponent);
            if (comp) comp.implements.push(...ids);
          } else if (!isImplements && lastPropertyId) {
            const prop = properties.find((p) => p.id === lastPropertyId);
            if (prop) prop.validates.push(...ids);
          }
        }
      }
    }
  }

  return { components, properties };
}

function generateDesignSection(
  grouped: Map<string, string[]>,
  acToComponents: Map<string, string[]>,
  acToProperties: Map<string, string[]>
): string {
  const lines: string[] = [];
  const reqFiles = [...grouped.keys()].sort();

  for (const reqFile of reqFiles) {
    lines.push(`### ${reqFile}`);
    lines.push('');

    const acIds = grouped.get(reqFile) ?? [];
    acIds.sort(compareIds);

    for (const acId of acIds) {
      const components = acToComponents.get(acId) ?? [];
      const props = acToProperties.get(acId) ?? [];

      for (const comp of components) {
        const propStr = props.length > 0 ? ` (${props.join(', ')})` : '';
        lines.push(`- ${acId} → ${comp}${propStr}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// --- TASK matrix ---

interface TaskInfo {
  readonly id: string;
  readonly implements: string[];
  readonly tests: string[];
}

async function fixTaskMatrix(
  filePath: string,
  reqFileMaps: ReqFileMaps,
  specs: SpecParseResult,
  crossRefPatterns: readonly string[],
  cachedContent?: string
): Promise<boolean> {
  let content: string;
  if (cachedContent != null) {
    content = cachedContent;
  } else {
    try {
      content = await readFile(filePath, 'utf-8');
    } catch {
      return false;
    }
  }

  const { tasks, sourceDesigns } = parseTaskFileData(content, crossRefPatterns);

  // AC → implementing task(s)
  const acToTasks = new Map<string, string[]>();
  for (const task of tasks) {
    for (const acId of task.implements) {
      const existing = acToTasks.get(acId) ?? [];
      existing.push(task.id);
      acToTasks.set(acId, existing);
    }
  }

  // AC/property → testing task(s)
  const idToTestTasks = new Map<string, string[]>();
  for (const task of tasks) {
    for (const testId of task.tests) {
      const existing = idToTestTasks.get(testId) ?? [];
      existing.push(task.id);
      idToTestTasks.set(testId, existing);
    }
  }

  // Collect property IDs from source DESIGN files (to distinguish from ACs in output)
  const sourcePropertyIds = new Set<string>();
  for (const designName of sourceDesigns) {
    const designCode = extractCodeFromFileName(designName);
    for (const sf of specs.specFiles) {
      if (sf.code === designCode && /\bDESIGN-/.test(basename(sf.filePath))) {
        for (const propId of sf.propertyIds) sourcePropertyIds.add(propId);
      }
    }
  }

  // Group ACs and properties by REQ file
  const allIdsForMatrix = [...new Set([...acToTasks.keys(), ...idToTestTasks.keys()])];
  const grouped = groupByReqFile(allIdsForMatrix, reqFileMaps);

  const newSection = generateTaskSection(grouped, acToTasks, idToTestTasks, sourcePropertyIds);
  const newContent = replaceTraceabilitySection(content, newSection);
  if (newContent === content) return false;

  await writeFile(filePath, newContent, 'utf-8');
  return true;
}

interface TaskFileParseResult {
  tasks: TaskInfo[];
  sourceReqs: string[];
  sourceDesigns: string[];
}

function parseTaskFileData(
  content: string,
  crossRefPatterns: readonly string[]
): TaskFileParseResult {
  const lines = content.split('\n');
  const tasks: TaskInfo[] = [];
  const sourceReqs: string[] = [];
  const sourceDesigns: string[] = [];

  // Parse SOURCE line
  const sourceRegex = /^SOURCE:\s*(.+)/;
  const taskIdRegex = /^-\s+\[[ x]\]\s+(T-[A-Z][A-Z0-9]*-\d+)/;

  let currentTaskId: string | null = null;

  for (const line of lines) {
    // SOURCE line
    const sourceMatch = sourceRegex.exec(line);
    if (sourceMatch?.[1]) {
      const parts = sourceMatch[1].split(',').map((s) => s.trim());
      for (const part of parts) {
        if (part.startsWith('REQ-')) sourceReqs.push(part);
        else if (part.startsWith('DESIGN-')) sourceDesigns.push(part);
      }
      continue;
    }

    // Task checkbox item
    const taskMatch = taskIdRegex.exec(line);
    if (taskMatch?.[1]) {
      currentTaskId = taskMatch[1];
      tasks.push({ id: currentTaskId, implements: [], tests: [] });
      continue;
    }

    // H2 heading resets task context (new phase)
    if (/^##\s/.test(line)) {
      currentTaskId = null;
      continue;
    }

    // --- or horizontal rule also resets
    if (/^---/.test(line)) {
      currentTaskId = null;
      continue;
    }

    // IMPLEMENTS / TESTS lines (indented under a task)
    if (currentTaskId) {
      const task = tasks.find((t) => t.id === currentTaskId);
      if (task) {
        for (const pattern of crossRefPatterns) {
          const patIdx = line.indexOf(pattern);
          if (patIdx !== -1) {
            const afterPattern = line.slice(patIdx + pattern.length);
            const ids = extractIdsFromText(afterPattern);
            if (ids.length > 0) {
              const isImplements = pattern.toLowerCase().includes('implements');
              if (isImplements) {
                task.implements.push(...ids);
              }
            }
          }
        }
        // TESTS: is not in crossRefPatterns, parse it directly
        const testsIdx = line.indexOf('TESTS:');
        if (testsIdx !== -1) {
          const afterTests = line.slice(testsIdx + 'TESTS:'.length);
          const ids = extractIdsFromText(afterTests);
          if (ids.length > 0) {
            task.tests.push(...ids);
          }
        }
      }
    }
  }

  return { tasks, sourceReqs, sourceDesigns };
}

function generateTaskSection(
  grouped: Map<string, string[]>,
  acToTasks: Map<string, string[]>,
  idToTestTasks: Map<string, string[]>,
  propertyIds: Set<string>
): string {
  const lines: string[] = [];
  const reqFiles = [...grouped.keys()].sort();

  for (const reqFile of reqFiles) {
    lines.push(`### ${reqFile}`);
    lines.push('');

    const ids = grouped.get(reqFile) ?? [];
    // Separate ACs from properties
    const acIds = ids.filter((id) => !propertyIds.has(id));
    const propIds = ids.filter((id) => propertyIds.has(id));

    acIds.sort(compareIds);
    propIds.sort(compareIds);

    // AC entries: - {AC-ID} → {Task} ({TestTask})
    for (const acId of acIds) {
      const tasks = acToTasks.get(acId) ?? [];
      const testTasks = idToTestTasks.get(acId) ?? [];
      const taskStr = tasks.length > 0 ? tasks.join(', ') : '(none)';
      const testStr = testTasks.length > 0 ? ` (${testTasks.join(', ')})` : '';
      lines.push(`- ${acId} → ${taskStr}${testStr}`);
    }

    // Property entries: - {Prop-ID} → {TestTask}
    for (const propId of propIds) {
      const testTasks = idToTestTasks.get(propId) ?? [];
      const testStr = testTasks.length > 0 ? testTasks.join(', ') : '(none)';
      lines.push(`- ${propId} → ${testStr}`);
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

// --- Shared utilities ---

function groupByReqFile(ids: string[], maps: ReqFileMaps): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const reqFile = resolveReqFile(id, maps);
    if (!reqFile) continue; // Skip IDs we can't resolve to a REQ file
    const existing = groups.get(reqFile) ?? [];
    existing.push(id);
    groups.set(reqFile, existing);
  }
  return groups;
}

function replaceTraceabilitySection(content: string, newSection: string): string {
  const lines = content.split('\n');
  const sectionStart = lines.findIndex((l) => /^##\s+Requirements Traceability\s*$/.test(l));

  if (sectionStart === -1) return content;

  // Find the next ## heading after the section start
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined && /^##\s/.test(line)) {
      sectionEnd = i;
      break;
    }
  }

  const before = lines.slice(0, sectionStart + 1);
  const after = lines.slice(sectionEnd);

  const result = [...before, '', newSection.trimEnd(), '', ...after];
  return result.join('\n');
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

function extractCodeFromFileName(fileName: string): string {
  // Extract CODE from REQ-CODE-feature.md or DESIGN-CODE-feature.md
  const match = /^(?:REQ|DESIGN|FEAT|EXAMPLE|API|TASK)-([A-Z][A-Z0-9]*)-/.exec(fileName);
  return match?.[1] ?? '';
}

function compareIds(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}
