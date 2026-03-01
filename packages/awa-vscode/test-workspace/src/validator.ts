// @awa-component: EX-Validator
// @awa-impl: EX-3_AC-1

export interface Schema {
  type: string;
  required?: string[];
}

/**
 * Validates input data against a schema.
 */
export function validate(data: unknown, schema: Schema): boolean {
  if (typeof data !== schema.type) {
    return false;
  }

  if (schema.required && typeof data === 'object' && data !== null) {
    for (const key of schema.required) {
      if (!(key in data)) {
        return false;
      }
    }
  }

  return true;
}
