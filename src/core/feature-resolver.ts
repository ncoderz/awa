// @awa-component: FP-FeatureResolver

import { ConfigError, type PresetDefinitions } from '../types/index.js';

export interface FeatureResolutionInput {
  baseFeatures: string[];
  presetNames: string[];
  removeFeatures: string[];
  presetDefinitions: PresetDefinitions;
}

export class FeatureResolver {
  validatePresets(presetNames: string[], definitions: PresetDefinitions): void {
    for (const name of presetNames) {
      if (!definitions[name]) {
        throw new ConfigError(`Unknown preset: ${name}`, 'UNKNOWN_PRESET');
      }
    }
  }

  resolve(input: FeatureResolutionInput): string[] {
    const { baseFeatures, presetNames, removeFeatures, presetDefinitions } = input;

    this.validatePresets(presetNames, presetDefinitions);

    const finalFeatures: string[] = [];
    const seen = new Set<string>();

    const add = (feature: string) => {
      if (seen.has(feature)) return;
      seen.add(feature);
      finalFeatures.push(feature);
    };

    for (const feature of baseFeatures) add(feature);

    for (const presetName of presetNames) {
      for (const feature of presetDefinitions[presetName] ?? []) add(feature);
    }

    if (removeFeatures.length === 0) return finalFeatures;

    const removeSet = new Set(removeFeatures);
    return finalFeatures.filter((f) => !removeSet.has(f));
  }
}

export const featureResolver = new FeatureResolver();
