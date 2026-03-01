// @awa-component: EX-Formatter
// @awa-impl: EX-2_AC-1
// @awa-impl: EX-2_AC-2

import type { ParsedData } from './parser';

/**
 * Formats parsed data into a human-readable string.
 */
export function formatOutput(data: ParsedData): string {
  if (
    !data.value ||
    (typeof data.value === 'object' && Object.keys(data.value as object).length === 0)
  ) {
    return '';
  }

  return `[${data.type}] ${JSON.stringify(data.value, null, 2)}`;
}
