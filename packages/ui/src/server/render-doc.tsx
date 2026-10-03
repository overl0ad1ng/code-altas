import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype"
import { evaluate, type MDXComponents } from "next-mdx-remote-client/rsc"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

import { getDocsComponents } from "../ui/mdx/components"
import type { ReadDocResult } from "./docs-content"
import type { ConfigExperimental } from "../interface/Config"
import { remarkPreview } from "./remark-preview"
import { rehypeHeadingIds } from "./rehype-heading-ids"
import { rehypeMermaid } from "./rehype-mermaid"

/** Compile project-owned content on the server with explicit component registration. */
export async function renderDoc(
  doc: Pick<ReadDocResult, "content" | "extension" | "slug" | "title">,
  components?: MDXComponents,
  experimental?: ConfigExperimental
) {
  let result
  try {
    result = await evaluate<Record<string, unknown>>({
      source: doc.content,
      components: { ...getDocsComponents(experimental), ...components },
      options: {
        parseFrontmatter: true,
        disableImports: true,
        disableExports: true,
        mdxOptions: {
          format: doc.extension === ".md" ? "md" : "mdx",
          remarkPlugins: [
            remarkGfm,
            remarkMath,
            ...(experimental?.experimentalComponentsInMDX
              ? [remarkPreview]
              : []),
          ],
          rehypePlugins: [
            rehypeHeadingIds,
            rehypeMermaid,
            [rehypeKatex, { trust: false }],
            [
              rehypeShiki,
              {
                themes: { light: "github-light", dark: "github-dark" },
                defaultColor: false,
                langs: [],
                lazy: true,
                addLanguageClass: true,
                defaultLanguage: "text",
                fallbackLanguage: "text",
                stripEndNewline: true,
                parseMetaString: (meta) => ({
                  title: meta
                    .match(/(?:^|\s)title=(?:"([^"]*)"|'([^']*)')/)
                    ?.slice(1)
                    .find((value) => value !== undefined),
                  highlight: meta.match(/\{([\d,\s-]+)\}/)?.[1],
                }),
                transformers: [
                  {
                    name: "codeblock-title",
                    pre(node) {
                      const title = this.options.meta?.title
                      if (typeof title === "string")
                        node.properties["data-title"] = title
                    },
                    line(node, line) {
                      const ranges = this.options.meta?.highlight
                      if (typeof ranges !== "string") return
                      if (
                        ranges.split(",").some((range) => {
                          const [start, end = start] = range
                            .trim()
                            .split("-")
                            .map(Number)
                          return (
                            start !== undefined &&
                            end !== undefined &&
                            line >= start &&
                            line <= end
                          )
                        })
                      )
                        this.addClassToHast(node, "highlighted")
                    },
                  },
                ],
              } satisfies RehypeShikiOptions,
            ],
          ],
        },
      },
    })
    if (result.error) throw result.error
  } catch (cause) {
    throw new Error(`Failed to compile document ${doc.slug}`, { cause })
  }

  const title = result.frontmatter.title
  const description = result.frontmatter.description
  const tags = result.frontmatter.tags

  return {
    title: typeof title === "string" && title.trim() ? title.trim() : doc.title,
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : null,
    tags: Array.isArray(tags)
      ? [
          ...new Set(
            tags
              .filter((tag): tag is string => typeof tag === "string")
              .map((tag) => tag.trim())
              .filter(Boolean)
          ),
        ]
      : [],
    content: result.content,
  }
}
