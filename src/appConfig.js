import config from './config.js';
import debugConfig, { enableAllDebugFlags } from './debugConfig.js';

// 🤖 Forced debug mode acts like a “god switch”: HTML `data-forced-debug-mode="true"`
//    1) promotes debug/console/assert/markup flags to true in runtime config
//    2) clones `debugConfig` with every flag enabled (even nested ones)
//    3) emits a passport log (`Forced debug mode is active`) when the test signal is enabled
export default function buildAppConfig(params) {
  const runtimeConfig = config(params);

  if (runtimeConfig.forcedDebugMode) {
    runtimeConfig.debugMode = true;
    runtimeConfig.consoleAssert = true;
    runtimeConfig.markupDebugMode = true;
  }

  const resolvedDebugConfig = runtimeConfig.forcedDebugMode
    ? enableAllDebugFlags(debugConfig)
    : debugConfig;

  return {
    ...runtimeConfig,
    debugConfig: resolvedDebugConfig,
  };
}
