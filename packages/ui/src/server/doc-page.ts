import { cache } from "react"

import { loadCodeAtlasConfig } from "./config"
import { readDoc } from "./docs-content"
import { renderDoc } from "./render-doc"
import type { MDXComponents } from "next-mdx-remote-client/rsc"

/** Share document compilation between metadata and page rendering per request. */
export const readRenderedDoc = cache(
  async (slug: string, cwd: string, components?: MDXComponents) => {
    const doc = await readDoc(slug, cwd)
    const rendered = await renderDoc(
      doc,
      components,
      (await loadCodeAtlasConfig(cwd)).experimental
    )
    return { doc, rendered }
  }
)
