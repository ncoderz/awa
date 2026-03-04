import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { collectFiles } from '../check/glob.js';
import type { SpecFile } from '../check/types.js';
import type { CodesResult, DocTypes, FeatureCode } from './types.js';

/**
 * Scan spec files to discover all feature codes with metadata.
 * Reuses the check engine's glob infrastructure for file discovery.
 */
export async function scanCodes(
  specFiles: readonly SpecFile[],
  specGlobs: readonly string[],
  specIgnore: readonly string[],
): Promise<CodesResult> {
  // Discover codes from all spec file types (FEAT, REQ, DESIGN, API)
  const codeMap = new Map<
    string,
    {
      feature: string;
      reqCount: number;
      feat: boolean;
      req: boolean;
      design: boolean;
      api: boolean;
      example: boolean;
    }
  >();

  // Also collect FEAT files from glob (they aren't always in specFiles)
  const featFiles = await collectFiles(
    specGlobs.filter((g) => g.includes('FEAT-')),
    specIgnore,
  );
  for (const fp of featFiles) {
    const fileName = basename(fp);
    const match = /^FEAT-([A-Z][A-Z0-9]*)-(.+)\.md$/.exec(fileName);
    if (!match?.[1]) continue;
    const code = match[1];
    const existing = codeMap.get(code);
    if (existing) {
      existing.feat = true;
    } else {
      codeMap.set(code, {
        feature: match[2] ?? code,
        reqCount: 0,
        feat: true,
        req: false,
        design: false,
        api: false,
        example: false,
      });
    }
  }

  for (const sf of specFiles) {
    if (!sf.code) continue;
    const fileName = basename(sf.filePath);
    const prefix = fileName.split('-')[0];

    const existing = codeMap.get(sf.code);
    if (existing) {
      if (prefix === 'REQ') {
        existing.req = true;
        existing.reqCount += sf.requirementIds.length;
        // Prefer feature name from REQ file over FEAT-derived name
        if (existing.feature === sf.code || !existing.feature) {
          existing.feature = extractFeatureName(fileName);
        }
      } else if (prefix === 'DESIGN') {
        existing.design = true;
      } else if (prefix === 'API') {
        existing.api = true;
      } else if (prefix === 'EXAMPLE') {
        existing.example = true;
      } else if (prefix === 'FEAT') {
        existing.feat = true;
      }
    } else {
      const feature =
        prefix === 'REQ' ? extractFeatureName(fileName) : extractFeatureNameGeneric(fileName);
      codeMap.set(sf.code, {
        feature,
        reqCount: prefix === 'REQ' ? sf.requirementIds.length : 0,
        feat: prefix === 'FEAT',
        req: prefix === 'REQ',
        design: prefix === 'DESIGN',
        api: prefix === 'API',
        example: prefix === 'EXAMPLE',
      });
    }
  }

  // Extract scope summaries with fallback chain
  const scopeMap = await extractScopeSummaries(specFiles, specGlobs, specIgnore);

  // Build result
  const codes: FeatureCode[] = [];
  for (const [code, meta] of codeMap) {
    const docs: DocTypes = {
      feat: meta.feat,
      req: meta.req,
      design: meta.design,
      api: meta.api,
      example: meta.example,
    };
    codes.push({
      code,
      feature: meta.feature,
      reqCount: meta.reqCount,
      scope: scopeMap.get(code) ?? '',
      docs,
    });
  }

  // Sort alphabetically by code
  codes.sort((a, b) => a.code.localeCompare(b.code));

  return { codes };
}

/**
 * Extract feature name from a REQ filename.
 * e.g. "REQ-CHK-check.md" → "check"
 */
function extractFeatureName(fileName: string): string {
  const name = basename(fileName, '.md');
  // REQ-CODE-feature-name → feature-name
  const match = /^REQ-[A-Z][A-Z0-9]*-(.+)$/.exec(name);
  return match?.[1] ?? name;
}

/**
 * Extract feature name from any spec filename (FEAT, DESIGN, API).
 * e.g. "DESIGN-CHK-check.md" → "check", "API-CHK-rest-api.tsp" → "rest-api"
 */
function extractFeatureNameGeneric(fileName: string): string {
  const name = basename(fileName).replace(/\.[^.]+$/, '');
  // PREFIX-CODE-feature-name → feature-name
  const match = /^[A-Z]+-[A-Z][A-Z0-9]*-(.+)$/.exec(name);
  return match?.[1] ?? name;
}

/**
 * Extract scope summaries using fallback chain:
 * 1. FEAT `## Scope Boundary` section
 * 2. FEAT first paragraph after first `##`
 * 3. REQ first paragraph after first `##`
 * 4. DESIGN first paragraph after first `##`
 */
async function extractScopeSummaries(
  specFiles: readonly SpecFile[],
  specGlobs: readonly string[],
  specIgnore: readonly string[],
): Promise<Map<string, string>> {
  const scopeMap = new Map<string, string>();

  // Collect FEAT files for scope extraction
  const scopeFeatFiles = await collectFiles(
    specGlobs.filter((g) => g.includes('FEAT-')),
    specIgnore,
  );

  // Build code → file path maps for fallback
  const featByCode = buildCodeMap(scopeFeatFiles, 'FEAT');
  const reqByCode = buildCodeMapFromSpecFiles(specFiles, 'REQ');
  const designByCode = buildCodeMapFromSpecFiles(specFiles, 'DESIGN');

  // Collect all codes that need scope
  const allCodes = new Set<string>();
  for (const code of featByCode.keys()) allCodes.add(code);
  for (const sf of specFiles) {
    if (sf.code) {
      allCodes.add(sf.code);
    }
  }

  for (const code of allCodes) {
    const scope = await resolveScope(code, featByCode, reqByCode, designByCode);
    if (scope) {
      scopeMap.set(code, scope);
    }
  }

  return scopeMap;
}

/**
 * Resolve scope text for a code using the fallback chain.
 */
async function resolveScope(
  code: string,
  featByCode: Map<string, string>,
  reqByCode: Map<string, string>,
  designByCode: Map<string, string>,
): Promise<string> {
  // 1. Try FEAT ## Scope Boundary
  const featPath = featByCode.get(code);
  if (featPath) {
    try {
      const content = await readFile(featPath, 'utf-8');
      const scopeBoundary = extractScopeBoundary(content);
      if (scopeBoundary) return scopeBoundary;

      // 2. Fall back to FEAT first paragraph
      const firstParagraph = extractFirstParagraph(content);
      if (firstParagraph) return firstParagraph;
    } catch {
      // Skip unreadable files
    }
  }

  // 3. Fall back to REQ first paragraph
  const reqPath = reqByCode.get(code);
  if (reqPath) {
    try {
      const content = await readFile(reqPath, 'utf-8');
      const firstParagraph = extractFirstParagraph(content);
      if (firstParagraph) return firstParagraph;
    } catch {
      // Skip unreadable files
    }
  }

  // 4. Fall back to DESIGN first paragraph
  const designPath = designByCode.get(code);
  if (designPath) {
    try {
      const content = await readFile(designPath, 'utf-8');
      const firstParagraph = extractFirstParagraph(content);
      if (firstParagraph) return firstParagraph;
    } catch {
      // Skip unreadable files
    }
  }

  return '';
}

/**
 * Build code → file path map from a list of file paths for a given prefix.
 */
function buildCodeMap(filePaths: string[], prefix: string): Map<string, string> {
  const map = new Map<string, string>();
  const regex = new RegExp(`^${prefix}-([A-Z][A-Z0-9]*)-`);
  for (const filePath of filePaths) {
    const name = basename(filePath, '.md');
    const match = regex.exec(name);
    if (match?.[1] && !map.has(match[1])) {
      map.set(match[1], filePath);
    }
  }
  return map;
}

/**
 * Build code → file path map from SpecFile entries for a given prefix.
 */
function buildCodeMapFromSpecFiles(
  specFiles: readonly SpecFile[],
  prefix: string,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const sf of specFiles) {
    if (sf.code && basename(sf.filePath).startsWith(`${prefix}-`) && !map.has(sf.code)) {
      map.set(sf.code, sf.filePath);
    }
  }
  return map;
}

/**
 * Extract text from the `## Scope Boundary` section in a FEAT file.
 * Returns the first paragraph after the heading, or empty string if not found.
 */
export function extractScopeBoundary(content: string): string {
  const lines = content.split('\n');
  let inSection = false;
  const paragraphLines: string[] = [];

  for (const line of lines) {
    if (!inSection) {
      if (/^##\s+Scope Boundary\s*$/.test(line)) {
        inSection = true;
      }
      continue;
    }

    const trimmed = line.trim();

    // Skip blank lines before the paragraph starts
    if (paragraphLines.length === 0 && trimmed === '') {
      continue;
    }

    // Stop at the next heading or blank line after we've started collecting
    if (paragraphLines.length > 0 && (trimmed === '' || /^#/.test(trimmed))) {
      break;
    }

    paragraphLines.push(trimmed);
  }

  const paragraph = paragraphLines.join(' ').trim();
  if (paragraph.length > 120) {
    return `${paragraph.slice(0, 117)}...`;
  }
  return paragraph;
}

/**
 * Extract the first paragraph after the first ## heading.
 * Returns the first non-empty paragraph text, truncated to a single line.
 */
export function extractFirstParagraph(content: string): string {
  const lines = content.split('\n');
  let foundHeading = false;
  const paragraphLines: string[] = [];

  for (const line of lines) {
    // Look for the first ## heading
    if (!foundHeading) {
      if (/^##\s/.test(line)) {
        foundHeading = true;
      }
      continue;
    }

    const trimmed = line.trim();

    // Skip blank lines before the paragraph starts
    if (paragraphLines.length === 0 && trimmed === '') {
      continue;
    }

    // Stop at the next heading or blank line after we've started collecting
    if (paragraphLines.length > 0 && (trimmed === '' || /^#/.test(trimmed))) {
      break;
    }

    paragraphLines.push(trimmed);
  }

  const paragraph = paragraphLines.join(' ').trim();
  // Truncate to ~120 chars for table display
  if (paragraph.length > 120) {
    return `${paragraph.slice(0, 117)}...`;
  }
  return paragraph;
}
