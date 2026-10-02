import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { loadCodeAtlasConfig } from "./config"
import { DocContentError } from "./docs-content"
import { readRenderedDoc } from "./doc-page"

export async function getSiteMetadata(cwd = process.cwd()): Promise<Metadata> {
  const config = await loadCodeAtlasConfig(cwd)
  return {
    title: { default: config.title, template: `%s | ${config.title}` },
    description: config.description,
    icons: { icon: config.icon || config.logo },
  }
}

/** Use the same frontmatter title and fallback as the visible document heading. */
export async function getDocMetadata(
  slug: string,
  cwd = process.cwd()
): Promise<Metadata> {
  let page
  try {
    page = await readRenderedDoc(slug, cwd, undefined)
  } catch (error) {
    if (error instanceof DocContentError) notFound()
    throw error
  }
  const config = await loadCodeAtlasConfig(cwd)
  return {
    title: page.rendered.title,
    description: page.rendered.description ?? config.description,
  }
}
