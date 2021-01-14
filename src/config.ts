/* eslint-disable no-process-env -- This is the config file */
// spell-checker: words cosmiconfig

import { cosmiconfigSync } from "cosmiconfig";

export interface GlobalConfig {
  HUNDREDPOINTS_ORIGIN: string;
}

const defaults: Partial<GlobalConfig> = {
  HUNDREDPOINTS_ORIGIN:
    process.env.HUNDREDPOINTS_ORIGIN || "https://app.hundredpoints.io",
};

const explorerSync = cosmiconfigSync("hundredpoints");
const result = explorerSync.search(
  process.env.HUNDREDPOINTS_INTEGRATION_CWD || process.cwd()
);

const config: GlobalConfig = result?.isEmpty
  ? defaults
  : { ...defaults, ...result?.config };

export default config;
