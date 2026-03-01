// @awa-component: EX-Parser
// @awa-impl: EX-1_AC-1
// @awa-impl: EX-1_AC-2

export interface ParsedData {
  type: string;
  value: unknown;
}

/**
 * Parses raw input into structured data.
 */
export function parseInput(raw: string): ParsedData {
  if (!raw || raw.trim().length === 0) {
    throw new Error('Invalid input: empty string');
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      type: typeof parsed,
      value: parsed,
    };
  } catch {
    throw new Error(`Invalid input: could not parse "${raw}"`);
  }
}
