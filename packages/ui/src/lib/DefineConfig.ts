import type { Config } from "../interface/Config"
import { flattenDocs } from "./docs-content"
import { validateDocsI18n } from "./docs-i18n"

export type { Config } from "../interface/Config"
export { parseDocsRoute, localizedDocHref } from "./docs-i18n"

export function defineConfig(config: Config): Config {
  if (config.docs?.i18n) {
    validateDocsI18n(config.docs.i18n)
    for (const entry of flattenDocs(config.docs.categories ?? [])) {
      const first = entry.slug.split("/").filter(Boolean)[0]
      if (first && Object.hasOwn(config.docs.i18n.locales, first)) {
        throw new Error(
          `Document slug conflicts with a locale prefix: ${entry.slug}`
        )
      }
    }
  }
  return {
    ...config,
    experimental: {
      experimentalComponentsInMDX: false,
      ...config.experimental,
    },
  }
}
