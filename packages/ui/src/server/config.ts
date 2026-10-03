import { loadConfig } from "c12"

import type { Config } from "../interface/Config"
import { defineConfig } from "../lib/DefineConfig"

/** Load codealtas.config.ts from the app directory (defaults to process.cwd()). */
export function loadCodeAtlasConfig(
  cwd?: string,
  required?: true
): Promise<Config>
export function loadCodeAtlasConfig(
  cwd: string,
  required: false
): Promise<Config | undefined>
export async function loadCodeAtlasConfig(
  cwd = process.cwd(),
  required = true
): Promise<Config | undefined> {
  const { config } = await loadConfig<Config>({
    name: "codealtas",
    cwd,
    configFile: "codealtas.config",
    configFileRequired: required,
    rcFile: false,
    globalRc: false,
    packageJson: false,
  })
  return config ? defineConfig(config) : undefined
}
