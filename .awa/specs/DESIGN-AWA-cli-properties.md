# awa CLI Design - Properties & Testing

> VERSION: 2.2.0 | STATUS: draft | UPDATED: 2026-02-24

This document contains correctness properties, error handling, and testing strategy for awa CLI.

PARENT DOCUMENT: [DESIGN-AWA-cli.md](DESIGN-AWA-cli.md)

## Correctness Properties

- CFG_P-1 [CLI Override]: CLI arguments always override config file values for the same option
  VALIDATES: CFG-4_AC-1, CFG-4_AC-2

- CFG_P-2 [Features Replace]: Features from CLI completely replace config features (no merge)
  VALIDATES: CFG-4_AC-4

- TPL_P-1 [Empty Skip]: Empty or whitespace-only template output results in no file creation
  VALIDATES: TPL-7_AC-1

- TPL_P-2 [Empty Marker]: Template containing only `<!-- AWA:EMPTY_FILE -->` creates an empty file
  VALIDATES: TPL-7_AC-2

- GEN_P-1 [Underscore Exclusion]: Files/directories starting with `_` are never written to output
  VALIDATES: GEN-8_AC-1, GEN-8_AC-2, TPL-9_AC-1, TPL-9_AC-2

- GEN_P-2 [Directory Mirror]: Output directory structure exactly mirrors template structure (excluding underscore paths)
  VALIDATES: GEN-1_AC-1, GEN-1_AC-2

- GEN_P-3 [Dry Run Immutable]: Dry-run mode never modifies the file system
  VALIDATES: GEN-6_AC-1, GEN-6_AC-2

- GEN_P-4 [Force No Prompt]: Force mode never prompts for conflict resolution
  VALIDATES: GEN-4_AC-3, CLI-5_AC-2

- GEN_P-5 [Content Identity Skip]: When existing file content exactly matches new content, file is skipped without prompting
  VALIDATES: GEN-5_AC-7

- TPL_P-3 [Local No Cache]: Local template paths are used directly without caching
  VALIDATES: TPL-1_AC-4

- TPL_P-4 [Git Cache Reuse]: Git templates use cached version unless --refresh is specified
  VALIDATES: TPL-3_AC-2

- DIFF_P-1 [Diff Read-Only]: Diff command never modifies the target directory
  VALIDATES: DIFF-1_AC-3

- DIFF_P-2 [Temp Cleanup Guaranteed]: Temp directory is always deleted, even on error
  VALIDATES: DIFF-6_AC-1, DIFF-6_AC-2, DIFF-6_AC-3

- DIFF_P-3 [Exact Comparison]: File comparison is byte-for-byte exact (whitespace-sensitive)
  VALIDATES: DIFF-2_AC-1

- DIFF_P-4 [Exit Code Semantics]: Exit 0 means identical, exit 1 means differences, exit 2 means error
  VALIDATES: DIFF-5_AC-1, DIFF-5_AC-2, DIFF-5_AC-3

- DIFF_P-5 [Unknown Opt-In]: Target-only files are excluded unless `listUnknown` is true; when true, they are reported as extras without altering generation scope
  VALIDATES: DIFF-3_AC-2, DIFF-3_AC-3, DIFF-3_AC-4, DIFF-7_AC-11

- GEN_P-6 [Delete Feature Gating]: Delete list entries under a `# @feature <name>` section are deleted only when NONE of the listed features are active
  VALIDATES: GEN-12_AC-8

- DIFF_P-6 [Delete-Listed Priority]: Files appearing in both the delete list and the extra list are reported only as `delete-listed`, never duplicated as `extra`
  VALIDATES: DIFF-8_AC-1, DIFF-8_AC-2, DIFF-8_AC-3

- FP_P-1 [Preset Validation]: Referencing a non-existent preset name results in an error
  VALIDATES: FP-2_AC-3

- FP_P-2 [Feature Resolution Order]: Final features = (baseFeatures ∪ presetFeatures) \ removeFeatures
  VALIDATES: FP-6_AC-1, FP-6_AC-2, FP-6_AC-3, FP-6_AC-4

- FP_P-3 [Feature Deduplication]: Final feature set contains no duplicates
  VALIDATES: FP-6_AC-5, FP-7_AC-2

- FP_P-4 [Preset Union]: Multiple presets are merged via set union
  VALIDATES: FP-7_AC-1

- FP_P-5 [Silent Removal]: Removing a non-existent feature does not cause an error
  VALIDATES: FP-4_AC-4

## Error Handling

### ConfigError

Configuration loading and parsing errors.

- FILE_NOT_FOUND: Specified config file does not exist (when --config provided)
- PARSE_ERROR: TOML syntax error with line number
- INVALID_TYPE: Config value has wrong type
- INVALID_PRESET: Preset value is not an array of strings
- UNKNOWN_PRESET: Referenced preset name does not exist in presets table

### TemplateError

Template resolution and rendering errors.

- SOURCE_NOT_FOUND: Local template path does not exist
- FETCH_FAILED: Git fetch failed (network, auth, repo not found)
- RENDER_ERROR: Eta template syntax error with location

### GenerationError

File generation errors.

- PERMISSION_DENIED: Cannot create directory or write file
- DISK_FULL: Insufficient disk space

### DiffError

Diff operation errors.

- TARGET_NOT_FOUND: Target directory does not exist
- TARGET_NOT_READABLE: Cannot read target directory or files
- TEMP_DIR_FAILED: Failed to create or write to temp directory

### Error Strategy

PRINCIPLES:
- Fail fast on first error
- Provide actionable error messages with file paths
- Write errors to stderr
- Exit with non-zero code on any error
- Include suggestions for common errors (e.g., "Did you mean...?" for typos)

## Testing Strategy

### Property-Based Testing

- FRAMEWORK: fast-check
- MINIMUM_ITERATIONS: 100
- TAG_FORMAT: @awa-test: {CODE}_P-{n}

```typescript
// @awa-test: CFG_P-1 (CLI Override)
test.prop([fc.string(), fc.string()])('CLI overrides config', (cliValue, configValue) => {
  const cli = { output: cliValue };
  const config = { output: configValue };
  const result = configLoader.merge(cli, config);
  expect(result.output).toBe(cliValue);
});

// @awa-test: GEN_P-1 (Underscore Exclusion)
test.prop([fc.string().filter(s => s.startsWith('_'))])('underscore files excluded', (filename) => {
  const actions = generator.processFile(filename);
  expect(actions).toHaveLength(0);
});

// @awa-test: GEN_P-5 (Content Identity Skip)
test.prop([fc.string()])('identical content skipped without prompt', async (content) => {
  const conflicts = [{ outputPath: 'test.txt', newContent: content, existingContent: content }];
  const resolution = await resolver.resolveBatch(conflicts, false, false);
  expect(resolution.skip).toContain('test.txt');
  expect(resolution.overwrite).not.toContain('test.txt');
});

// @awa-test: DIFF_P-1 (Diff Read-Only)
test.prop([fc.array(fc.string())])('diff never modifies target', async (files) => {
  const targetDir = await createTempDir(files);
  const checksumsBefore = await computeChecksums(targetDir);
  await differ.diff({ templatePath: 'template', targetPath: targetDir, features: [] });
  const checksumsAfter = await computeChecksums(targetDir);
  expect(checksumsAfter).toEqual(checksumsBefore);
});

// @awa-test: DIFF_P-2 (Temp Cleanup Guaranteed)
test.prop([fc.boolean()])('temp cleanup even on error', async (shouldError) => {
  const tempDirsBefore = await listTempDirs();
  try {
    await differ.diff({ templatePath: shouldError ? 'invalid' : 'valid', targetPath: 'target', features: [] });
  } catch (e) { /* expected */ }
  const tempDirsAfter = await listTempDirs();
  expect(tempDirsAfter).toEqual(tempDirsBefore);
});

// @awa-test: DIFF_P-3 (Exact Comparison)
test.prop([fc.string(), fc.string()])('whitespace differences detected', async (text1, text2) => {
  fc.pre(text1 !== text2);
  const result = await differ.compareFiles(text1, text2);
  expect(result.status).toBe('modified');
});

// @awa-test: DIFF_P-4 (Exit Code Semantics)
test.prop([fc.constantFrom('identical', 'different', 'error')])('exit codes match semantics', async (scenario) => {
  const result = await runDiff(scenario);
  if (scenario === 'identical') expect(result.exitCode).toBe(0);
  if (scenario === 'different') expect(result.exitCode).toBe(1);
  if (scenario === 'error') expect(result.exitCode).toBe(2);
});

// @awa-test: FP_P-1 (Preset Validation)
test.prop([fc.string(), fc.record({ presets: fc.dictionary(fc.string(), fc.array(fc.string())) })])(
  'non-existent preset errors', (presetName, config) => {
    fc.pre(!config.presets[presetName]);
    expect(() => featureResolver.validatePresets([presetName], config.presets)).toThrow();
  }
);

// @awa-test: FP_P-2 (Feature Resolution Order)
test.prop([fc.array(fc.string()), fc.array(fc.string()), fc.array(fc.string())])(
  'feature resolution order', (base, preset, remove) => {
    const result = featureResolver.resolve({ baseFeatures: base, presetFeatures: preset, removeFeatures: remove, presetDefinitions: {} });
    const expected = new Set([...base, ...preset]);
    remove.forEach(f => expected.delete(f));
    expect(new Set(result)).toEqual(expected);
  }
);

// @awa-test: FP_P-3 (Feature Deduplication)
test.prop([fc.array(fc.string())])('no duplicate features', (features) => {
  const result = featureResolver.resolve({ baseFeatures: [...features, ...features], presetFeatures: [], removeFeatures: [], presetDefinitions: {} });
  expect(result.length).toBe(new Set(result).size);
});

// @awa-test: FP_P-4 (Preset Union)
test.prop([fc.dictionary(fc.string(), fc.array(fc.string())), fc.array(fc.string())])(
  'preset union', (presetDefs, presetNames) => {
    fc.pre(presetNames.every(n => presetDefs[n]));
    const result = featureResolver.resolve({ baseFeatures: [], presetFeatures: [], removeFeatures: [], presetDefinitions: presetDefs });
    const expected = new Set(presetNames.flatMap(n => presetDefs[n]));
    expect(new Set(result)).toEqual(expected);
  }
);

// @awa-test: FP_P-5 (Silent Removal)
test.prop([fc.array(fc.string()), fc.string()])('removing non-existent feature no error', (features, nonExistent) => {
  fc.pre(!features.includes(nonExistent));
  expect(() => featureResolver.resolve({ baseFeatures: features, presetFeatures: [], removeFeatures: [nonExistent], presetDefinitions: {} })).not.toThrow();
});
```

### Unit Testing

- DESCRIPTION: Test individual components in isolation
- AREAS: CFG-ConfigLoader merge logic, TPL-TemplateResolver type detection, TPL-TemplateEngine empty detection, GEN-ConflictResolver prompt logic, GEN-DeleteList parsing, GEN-DeleteResolver confirmation flow

### Integration Testing

- DESCRIPTION: Test full generation pipeline with real templates
- SCENARIOS: Local template generation, Git template caching, Conflict resolution flow, Dry-run output verification, Delete list processing with feature gating, Diff with delete-listed files
