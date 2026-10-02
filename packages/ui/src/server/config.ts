import { loadConfig } from "c12"

import type { Config } from "../interface/Config"

/** Load codealtas.config.ts from the app directory (defaults to process.cwd()). */
export async function loadCodeAtlasConfig(
  cwd = process.cwd()
): Promise<Config> {
  const { config } = await loadConfig<Config>({
    name: "codealtas",
    cwd,
    configFile: "codealtas.config",
    configFileRequired: true,
    rcFile: false,
    globalRc: false,
    packageJson: false,
  })
  return config
}
