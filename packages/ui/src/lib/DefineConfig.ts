import type { Config } from "../interface/Config"

export type { Config } from "../interface/Config"

export function defineConfig(config: Config): Config {
  return {
    ...config,
    experimental: {
      experimentalComponentsInMDX: false,
      ...config.experimental,
    },
  }
}
