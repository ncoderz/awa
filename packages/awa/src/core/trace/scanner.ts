// @awa-component: TRC-SharedScanner
// @awa-impl: TRC-1_AC-1

import type { FileConfig } from '../../types/index.js';
import { scanMarkers } from '../check/marker-scanner.js';
import { parseSpecs } from '../check/spec-parser.js';
import type { CheckConfig, MarkerScanResult, SpecParseResult } from '../check/types.js';
import { DEFAULT_CHECK_CONFIG } from '../check/types.js';
import { configLoader } from '../config.js';

/** Results from scanning markers and specs in parallel. */
export interface ScanResults {
  readonly markers: MarkerScanResult;
  readonly specs: SpecParseResult;
  readonly config: CheckConfig;
}

/**
 * Build a CheckConfig from file config + optional overrides.
 * Shared by trace, coverage, impact, and graph commands.
 */
export function buildScanConfig(
  fileConfig: FileConfig | null,
  overrides?: Partial<CheckConfig>
): CheckConfig {
  const section = fileConfig?.check;

  return {
    specGlobs: toStringArray(section?.['spec-globs']) ?? [...DEFAULT_CHECK_CONFIG.specGlobs],
    codeGlobs: toStringArray(section?.['code-globs']) ?? [...DEFAULT_CHECK_CONFIG.codeGlobs],
    specIgnore: toStringArray(section?.['spec-ignore']) ?? [...DEFAULT_CHECK_CONFIG.specIgnore],
    codeIgnore: toStringArray(section?.['code-ignore']) ?? [...DEFAULT_CHECK_CONFIG.codeIgnore],
    ignoreMarkers: toStringArray(section?.['ignore-markers']) ?? [
      ...DEFAULT_CHECK_CONFIG.ignoreMarkers,
    ],
    markers: toStringArray(section?.markers) ?? [...DEFAULT_CHECK_CONFIG.markers],
    idPattern:
      typeof section?.['id-pattern'] === 'string'
        ? section['id-pattern']
        : DEFAULT_CHECK_CONFIG.idPattern,
    crossRefPatterns: toStringArray(section?.['cross-ref-patterns']) ?? [
      ...DEFAULT_CHECK_CONFIG.crossRefPatterns,
    ],
    format: DEFAULT_CHECK_CONFIG.format,
    schemaDir: DEFAULT_CHECK_CONFIG.schemaDir,
    schemaEnabled: false,
    allowWarnings: true,
    specOnly: false,
    ...overrides,
  };
}

/**
 * Load config, scan markers and parse specs in parallel.
 * Shared by trace, coverage, impact, and graph commands.
 */
export async function scan(configPath?: string): Promise<ScanResults> {
  const fileConfig = await configLoader.load(configPath ?? null);
  const config = buildScanConfig(fileConfig);

  const [markers, specs] = await Promise.all([scanMarkers(config), parseSpecs(config)]);

  return { markers, specs, config };
}

function toStringArray(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value as string[];
  }
  return null;
}
