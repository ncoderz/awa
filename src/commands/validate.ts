// @awa-component: VAL-ValidateCommand
// @awa-impl: VAL-8_AC-1
// @awa-impl: VAL-10_AC-1

import { configLoader } from '../core/config.js';
import { checkCodeAgainstSpec } from '../core/validate/code-spec-checker.js';
import { scanMarkers } from '../core/validate/marker-scanner.js';
import { report } from '../core/validate/reporter.js';
import { loadRules } from '../core/validate/rule-loader.js';
import { checkSchemasAsync } from '../core/validate/schema-checker.js';
import { parseSpecs } from '../core/validate/spec-parser.js';
import { checkSpecAgainstSpec } from '../core/validate/spec-spec-checker.js';
import type { RawValidateOptions, ValidateConfig } from '../core/validate/types.js';
import { DEFAULT_VALIDATE_CONFIG } from '../core/validate/types.js';
import type { FileConfig } from '../types/index.js';
import { logger } from '../utils/logger.js';

// @awa-impl: VAL-8_AC-1
export async function validateCommand(cliOptions: RawValidateOptions): Promise<number> {
  try {
    // Load config from file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Build validate config from file [validate] section + CLI overrides
    const config = buildValidateConfig(fileConfig, cliOptions);

    // Scan code markers, parse specs, and load schema rules in parallel
    const [markers, specs, ruleSets] = await Promise.all([
      scanMarkers(config),
      parseSpecs(config),
      config.schemaEnabled ? loadRules(config.schemaDir) : Promise.resolve([]),
    ]);

    // Run checkers (code-spec and spec-spec are synchronous; schema is async)
    const codeSpecResult = checkCodeAgainstSpec(markers, specs, config);
    const specSpecResult = checkSpecAgainstSpec(specs, markers, config);
    const schemaResult =
      config.schemaEnabled && ruleSets.length > 0
        ? await checkSchemasAsync(specs.specFiles, ruleSets)
        : { findings: [] as const };

    // Combine findings
    const allFindings = [
      ...codeSpecResult.findings,
      ...specSpecResult.findings,
      ...schemaResult.findings,
    ];

    // Report results
    report(allFindings, config.format);

    // Exit code: 0 = clean, 1 = errors found
    const hasErrors = allFindings.some((f) => f.severity === 'error');
    return hasErrors ? 1 : 0;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    return 2;
  }
}

// @awa-impl: VAL-10_AC-1, VAL-16_AC-1
function buildValidateConfig(
  fileConfig: FileConfig | null,
  cliOptions: RawValidateOptions
): ValidateConfig {
  const validate = fileConfig?.validate;

  const specGlobs = toStringArray(validate?.['spec-globs']) ?? [
    ...DEFAULT_VALIDATE_CONFIG.specGlobs,
  ];
  const codeGlobs = toStringArray(validate?.['code-globs']) ?? [
    ...DEFAULT_VALIDATE_CONFIG.codeGlobs,
  ];
  const markers = toStringArray(validate?.markers) ?? [...DEFAULT_VALIDATE_CONFIG.markers];
  const crossRefPatterns = toStringArray(validate?.['cross-ref-patterns']) ?? [
    ...DEFAULT_VALIDATE_CONFIG.crossRefPatterns,
  ];
  const idPattern =
    typeof validate?.['id-pattern'] === 'string'
      ? validate['id-pattern']
      : DEFAULT_VALIDATE_CONFIG.idPattern;

  // CLI --ignore appends to config ignore
  const configIgnore = toStringArray(validate?.ignore) ?? [...DEFAULT_VALIDATE_CONFIG.ignore];
  const cliIgnore = cliOptions.ignore ?? [];
  const ignore = [...configIgnore, ...cliIgnore];

  const format: 'text' | 'json' =
    cliOptions.format === 'json'
      ? 'json'
      : validate?.format === 'json'
        ? 'json'
        : DEFAULT_VALIDATE_CONFIG.format;

  const schemaDir =
    typeof validate?.['schema-dir'] === 'string'
      ? validate['schema-dir']
      : DEFAULT_VALIDATE_CONFIG.schemaDir;

  const schemaEnabled =
    typeof validate?.['schema-enabled'] === 'boolean'
      ? validate['schema-enabled']
      : DEFAULT_VALIDATE_CONFIG.schemaEnabled;

  return {
    specGlobs,
    codeGlobs,
    ignore,
    markers,
    idPattern,
    crossRefPatterns,
    format,
    schemaDir,
    schemaEnabled,
  };
}

function toStringArray(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value as string[];
  }
  return null;
}
