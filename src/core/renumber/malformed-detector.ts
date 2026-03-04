// @awa-component: RENUM-MalformedDetector
// @awa-impl: RENUM-12_AC-1, RENUM-12_AC-2, RENUM-12_AC-3

import { writeFile } from 'node:fs/promises';

import type { MalformedCorrection, MalformedWarning } from './types.js';

/**
 * Standard ID patterns that are considered valid.
 * - CODE-N (requirement)
 * - CODE-N.P (subrequirement)
 * - CODE-N_AC-M or CODE-N.P_AC-M (acceptance criterion)
 * - CODE_P-N (property)
 * - CODE-ComponentName (component — PascalCase name after code)
 */
const VALID_ID_RE = /^[A-Z][A-Z0-9]*(?:-\d+(?:\.\d+)?(?:_AC-\d+)?|_P-\d+|-[A-Z][a-zA-Z0-9]*)$/;

/**
 * Patterns that can be unambiguously expanded into valid IDs:
 *
 * - Slash ranges on ACs: CODE-N_AC-M/P or CODE-N.S_AC-M/P
 *   e.g. ARC-36_AC-8/9 → ARC-36_AC-8, ARC-36_AC-9
 *
 * - Dot-dot ranges on ACs: CODE-N_AC-M..P or CODE-N.S_AC-M..P
 *   e.g. ARC-18_AC-14..16 → ARC-18_AC-14, ARC-18_AC-15, ARC-18_AC-16
 */

/** Slash range on ACs: e.g. ARC-36_AC-8/9 */
const SLASH_RANGE_RE = /^([A-Z][A-Z0-9]*-\d+(?:\.\d+)?_AC-)(\d+)\/(\d+)$/;

/** Dot-dot range on ACs: e.g. ARC-18_AC-14..16 */
const DOT_DOT_AC_RANGE_RE = /^([A-Z][A-Z0-9]*-\d+(?:\.\d+)?_AC-)(\d+)\.\.(\d+)$/;

/**
 * Detect tokens that start with the feature code prefix but do not conform
 * to standard ID formats. Reports each as a warning with location.
 */
// @awa-impl: RENUM-12_AC-1, RENUM-12_AC-2
export function detectMalformed(
  code: string,
  fileContents: ReadonlyMap<string, string>,
): readonly MalformedWarning[] {
  const warnings: MalformedWarning[] = [];

  // Match tokens that structurally resemble IDs:
  //   CODE-<Uppercase-or-digit>...  (requirement-like or component-like)
  //   CODE_P-...                    (property-like)
  // Tokens like CODE-lowercase (e.g. CLI-provided) are natural language, not IDs.
  const esc = escapeRegex(code);
  const tokenRegex = new RegExp(
    `(?<![A-Za-z0-9_.-])(?:${esc}-[A-Z0-9][A-Za-z0-9_./-]*|${esc}_P-[A-Za-z0-9_./-]+)`,
    'g',
  );

  for (const [filePath, content] of fileContents) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string;
      let match: RegExpExecArray | null;
      while ((match = tokenRegex.exec(line)) !== null) {
        const token = match[0];
        // @awa-impl: RENUM-12_AC-3
        if (!VALID_ID_RE.test(token)) {
          warnings.push({ filePath, line: i + 1, token });
        }
      }
    }
  }

  return warnings;
}

/**
 * Attempt to expand a single malformed token into its corrected replacement string.
 * Returns the replacement string if unambiguous, or `undefined` if the pattern
 * is ambiguous and should remain as a warning only.
 *
 * Correctable patterns:
 * - Slash ranges: CODE-N_AC-M/P → "CODE-N_AC-M, CODE-N_AC-P"
 * - Dot-dot AC ranges: CODE-N_AC-M..P → "CODE-N_AC-M, CODE-N_AC-M+1, ..., CODE-N_AC-P"
 *
 * Ambiguous / ignored patterns (return undefined):
 * - Trailing periods (e.g. ARC_P-206.) — likely end of sentence
 * - Letter suffixes (e.g. ARC-18_AC-7a)
 * - Full-ID ranges (e.g. ARC-20..ARC-25)
 * - Component + period (e.g. ARC-ChunkedTransferManager.)
 */
export function expandMalformedToken(token: string): string | undefined {
  // Try slash range: CODE-N_AC-M/P
  const slashMatch = SLASH_RANGE_RE.exec(token);
  if (slashMatch) {
    const [, prefix, startStr, endStr] = slashMatch as RegExpExecArray &
      [string, string, string, string];
    return `${prefix}${startStr}, ${prefix}${endStr}`;
  }

  // Try dot-dot AC range: CODE-N_AC-M..P
  const dotDotMatch = DOT_DOT_AC_RANGE_RE.exec(token);
  if (dotDotMatch) {
    const [, prefix, startStr, endStr] = dotDotMatch as RegExpExecArray &
      [string, string, string, string];
    const start = Number(startStr);
    const end = Number(endStr);
    if (end <= start) return undefined; // Invalid range
    const ids: string[] = [];
    for (let n = start; n <= end; n++) {
      ids.push(`${prefix}${n}`);
    }
    return ids.join(', ');
  }

  // All other patterns are ambiguous — do not correct
  return undefined;
}

/**
 * Apply malformed ID corrections to file contents.
 * Only corrects tokens for which `expandMalformedToken` returns a value.
 * Returns the list of corrections applied and the updated file contents map.
 *
 * When `dryRun` is true, files are not written to disk but corrections are
 * still computed and returned for preview.
 */
export async function correctMalformed(
  _code: string,
  warnings: readonly MalformedWarning[],
  fileContents: ReadonlyMap<string, string>,
  dryRun: boolean,
): Promise<{
  corrections: readonly MalformedCorrection[];
  remainingWarnings: readonly MalformedWarning[];
}> {
  const corrections: MalformedCorrection[] = [];
  const remainingWarnings: MalformedWarning[] = [];

  // Group warnings by file for efficient batch replacement
  const warningsByFile = new Map<string, MalformedWarning[]>();
  for (const w of warnings) {
    const existing = warningsByFile.get(w.filePath) ?? [];
    existing.push(w);
    warningsByFile.set(w.filePath, existing);
  }

  // Track files that need writing
  const modifiedFiles = new Map<string, string>();

  for (const [filePath, fileWarnings] of warningsByFile) {
    const original = fileContents.get(filePath);
    if (original === undefined) {
      // Cannot correct — keep as warnings
      remainingWarnings.push(...fileWarnings);
      continue;
    }

    let content: string = original;

    for (const w of fileWarnings) {
      const replacement = expandMalformedToken(w.token);
      if (replacement === undefined) {
        remainingWarnings.push(w);
        continue;
      }

      // Replace the token in content (whole-token match to avoid partial substitution)
      const escaped = escapeRegex(w.token);
      const regex = new RegExp(`(?<![A-Za-z0-9_.-])${escaped}(?![A-Za-z0-9_.-])`, 'g');
      const updated: string = content.replace(regex, replacement);
      if (updated !== content) {
        content = updated;
        corrections.push({
          filePath: w.filePath,
          line: w.line,
          token: w.token,
          replacement,
        });
      } else {
        // Token not found in content (unexpected) — keep as warning
        remainingWarnings.push(w);
      }
    }

    if (content !== original) {
      modifiedFiles.set(filePath, content);
    }
  }

  // Write modified files unless dry-run
  if (!dryRun) {
    for (const [filePath, content] of modifiedFiles) {
      await writeFile(filePath, content, 'utf-8');
    }
  }

  return { corrections, remainingWarnings };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
