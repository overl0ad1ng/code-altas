import { notFound } from "next/navigation"
import type { MDXComponents } from "next-mdx-remote-client/rsc"
import type { ReactNode } from "react"

import {
  DocContentError,
  loadCodeAtlasConfig,
  loadDocsIndex,
} from "../../server"
import { readRenderedDoc } from "../../server/doc-page"
import { getDocPagination } from "../../lib/docs-navigation"
import { DocsPagination } from "../navigation/docs-pagination"
import { Tags } from "../mdx/components/tags"
import { DocsToc } from "../../components/docs-toc"

export interface DocsPageProps {
  params: Promise<{ slug?: string[] }>
  components?: MDXComponents
  /** Additional sidebar content, including elements imported from "use client" modules. */
  aside?: ReactNode
}

export async function DocsPage({ params, components, aside }: DocsPageProps) {
  const { slug } = await params
  let page
  try {
    page = await readRenderedDoc(
      `/${(slug ?? []).join("/")}`,
      process.cwd(),
      components
    )
  } catch (error) {
    if (error instanceof DocContentError) notFound()
    throw error
  }

  const { doc, rendered } = page
  const [index, config] = await Promise.all([
    loadDocsIndex(),
    loadCodeAtlasConfig(),
  ])
  const pagination = getDocPagination(index, doc.slug)

  return (
    <div
      data-doc-page
      className="grid min-w-0 items-start xl:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <article
        data-doc-slug={doc.slug}
        className="mx-auto w-full max-w-4xl min-w-0 px-4 wrap-anywhere text-foreground sm:px-6"
      >
        <div className="mb-8 space-y-2">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight">
              {rendered.title}
            </h1>
          </div>
          {rendered.description && (
            <p className="text-sm text-neutral-500">{rendered.description}</p>
          )}
          <Tags tags={rendered.tags} colors={config.docs?.tags} />
        </div>
        <div data-doc-body>{rendered.content}</div>
        <DocsPagination {...pagination} />
      </article>
      <aside
        data-slot="docs-sidebar"
        aria-label="Article sidebar"
        className="hidden min-w-0 self-stretch pr-12 xl:block"
      >
        <div className="sticky top-22 flex max-h-[calc(100dvh-6rem)] min-h-0 flex-col gap-6">
          <DocsToc key={doc.slug} />
          {aside && (
            <div data-slot="docs-sidebar-content" className="shrink-0">
              {aside}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
