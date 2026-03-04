// @awa-component: RENUM-MalformedDetector
// @awa-impl: RENUM-12_AC-1, RENUM-12_AC-2, RENUM-12_AC-3

import type { MalformedWarning } from './types.js';

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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
