// @awa-component: CHK-CheckCommand
// @awa-impl: CHK-8_AC-1
// @awa-impl: CHK-10_AC-1

import { checkCodeAgainstSpec } from '../core/check/code-spec-checker.js';
import { scanMarkers } from '../core/check/marker-scanner.js';
import { report } from '../core/check/reporter.js';
import { loadRules } from '../core/check/rule-loader.js';
import { checkSchemasAsync } from '../core/check/schema-checker.js';
import { parseSpecs } from '../core/check/spec-parser.js';
import { checkSpecAgainstSpec } from '../core/check/spec-spec-checker.js';
import type { CheckConfig, RawCheckOptions } from '../core/check/types.js';
import { DEFAULT_CHECK_CONFIG } from '../core/check/types.js';
import { configLoader } from '../core/config.js';
import type { FileConfig } from '../types/index.js';
import { logger } from '../utils/logger.js';

// @awa-impl: CHK-8_AC-1
export async function checkCommand(cliOptions: RawCheckOptions): Promise<number> {
  try {
    // Load config from file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Build check config from file [check] section + CLI overrides
    const config = buildCheckConfig(fileConfig, cliOptions);

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
      ...markers.findings,
      ...codeSpecResult.findings,
      ...specSpecResult.findings,
      ...schemaResult.findings,
    ];

    // Report results
    report(allFindings, config.format);

    // Exit code: 0 = clean, 1 = errors or warnings (unless --allow-warnings)
    const hasErrors = allFindings.some((f) => f.severity === 'error');
    const hasWarnings = allFindings.some((f) => f.severity === 'warning');
    return hasErrors || (!config.allowWarnings && hasWarnings) ? 1 : 0;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    return 2;
  }
}

// @awa-impl: CHK-10_AC-1, CHK-16_AC-1
function buildCheckConfig(fileConfig: FileConfig | null, cliOptions: RawCheckOptions): CheckConfig {
  const section = fileConfig?.check;

  const specGlobs = toStringArray(section?.['spec-globs']) ?? [...DEFAULT_CHECK_CONFIG.specGlobs];
  const codeGlobs = toStringArray(section?.['code-globs']) ?? [...DEFAULT_CHECK_CONFIG.codeGlobs];
  const markers = toStringArray(section?.markers) ?? [...DEFAULT_CHECK_CONFIG.markers];
  const crossRefPatterns = toStringArray(section?.['cross-ref-patterns']) ?? [
    ...DEFAULT_CHECK_CONFIG.crossRefPatterns,
  ];
  const idPattern =
    typeof section?.['id-pattern'] === 'string'
      ? section['id-pattern']
      : DEFAULT_CHECK_CONFIG.idPattern;

  // CLI --ignore appends to config ignore
  const configIgnore = toStringArray(section?.ignore) ?? [...DEFAULT_CHECK_CONFIG.ignore];
  const cliIgnore = cliOptions.ignore ?? [];
  const ignore = [...configIgnore, ...cliIgnore];

  const ignoreMarkers = toStringArray(section?.['ignore-markers']) ?? [
    ...DEFAULT_CHECK_CONFIG.ignoreMarkers,
  ];

  const format: 'text' | 'json' =
    cliOptions.format === 'json'
      ? 'json'
      : section?.format === 'json'
        ? 'json'
        : DEFAULT_CHECK_CONFIG.format;

  const schemaDir =
    typeof section?.['schema-dir'] === 'string'
      ? section['schema-dir']
      : DEFAULT_CHECK_CONFIG.schemaDir;

  const schemaEnabled =
    typeof section?.['schema-enabled'] === 'boolean'
      ? section['schema-enabled']
      : DEFAULT_CHECK_CONFIG.schemaEnabled;

  const allowWarnings =
    cliOptions.allowWarnings === true
      ? true
      : typeof section?.['allow-warnings'] === 'boolean'
        ? section['allow-warnings']
        : DEFAULT_CHECK_CONFIG.allowWarnings;

  return {
    specGlobs,
    codeGlobs,
    ignore,
    ignoreMarkers,
    markers,
    idPattern,
    crossRefPatterns,
    format,
    schemaDir,
    schemaEnabled,
    allowWarnings,
  };
}

function toStringArray(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value as string[];
  }
  return null;
}
