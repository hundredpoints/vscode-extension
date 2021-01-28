/* eslint-disable no-process-env -- This is the config file */
// spell-checker: words cosmiconfig

import { cosmiconfigSync } from "cosmiconfig";

export interface GlobalConfig {
  HUNDREDPOINTS_ORIGIN: string;
  HUNDREDPOINTS_API: string;
}

const explorerSync = cosmiconfigSync("hundredpoints");
const result = explorerSync.search(
  process.env.HUNDREDPOINTS_INTEGRATION_CWD || process.cwd()
);

const origin =
  result?.config.HUNDREDPOINTS_ORIGIN ||
  process.env.HUNDREDPOINTS_ORIGIN ||
  "https://app.hundredpoints.io";

const defaults: Partial<GlobalConfig> = {
  HUNDREDPOINTS_ORIGIN: origin,
  HUNDREDPOINTS_API: `${origin}/api/graphql`,
};

const config: GlobalConfig = result?.isEmpty
  ? defaults
  : { ...defaults, ...result?.config };

export default config;
