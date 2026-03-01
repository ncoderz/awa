// CLI-wired config module — re-exports ConfigLoader from awa-core with a
// logger-wired configLoader singleton so unknown options show in the CLI output.
// @awa-component: CFG-ConfigLoader
// @awa-component: MULTI-TargetResolver
export { ConfigError, ConfigLoader, configLoader as defaultConfigLoader } from '@ncoderz/awa-core';

import { ConfigLoader } from '@ncoderz/awa-core';
import { logger } from '../utils/logger.js';

export const configLoader = new ConfigLoader(logger.warn.bind(logger));
