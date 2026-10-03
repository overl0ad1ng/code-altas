import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkMdx from "remark-mdx"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import { parse as parseYaml } from "yaml"
import { rehypeHeadingIds } from "./rehype-heading-ids"
import type { ReadDocResult } from "./docs-content"

interface TextNode {
  type: string
  tagName?: string
  name?: string
  value?: string
  properties?: Record<string, unknown>
  children?: TextNode[]
}

export interface SearchSection {
  heading?: string
  anchor?: string
  text: string
  code: string
}

const excluded = new Set([
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
  "raw",
  "yaml",
])
const blocks = new Set([
  "p",
  "div",
  "section",
  "article",
  "blockquote",
  "li",
  "ul",
  "ol",
  "table",
  "tr",
  "td",
  "th",
  "br",
])

function plain(node: TextNode): string {
  if (excluded.has(node.type)) return ""
  if (
    node.tagName === "script" ||
    node.tagName === "style" ||
    node.name === "script" ||
    node.name === "style"
  )
    return ""
  if (node.type === "text") return node.value ?? ""
  if (node.tagName === "img") return String(node.properties?.alt ?? "")
  const separator = node.tagName === "tr" || node.tagName === "table" ? " " : ""
  return (node.children ?? []).map(plain).join(separator)
}

/** Parse source without evaluating MDX or running rendering/highlighting. */
export function extractSearchDocument(
  doc: Pick<ReadDocResult, "content" | "extension" | "title">
) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkMath)
  if (doc.extension === ".mdx") processor.use(remarkMdx)
  processor
    .use(remarkRehype, {
      passThrough: [
        "mdxJsxFlowElement",
        "mdxJsxTextElement",
        "mdxjsEsm",
        "mdxFlowExpression",
        "mdxTextExpression",
      ],
    })
    .use(rehypeHeadingIds)
  const markdown = processor.parse(doc.content)
  const frontmatter = markdown.children.find((node) => node.type === "yaml")
  const parsed: unknown =
    frontmatter && "value" in frontmatter
      ? parseYaml(String(frontmatter.value))
      : undefined
  const authoredTitle =
    parsed && typeof parsed === "object" && "title" in parsed
      ? parsed.title
      : undefined
  const description =
    parsed &&
    typeof parsed === "object" &&
    "description" in parsed &&
    typeof parsed.description === "string"
      ? parsed.description.trim()
      : ""
  const title =
    typeof authoredTitle === "string" && authoredTitle.trim()
      ? authoredTitle.trim()
      : doc.title
  const tree = processor.runSync(markdown) as unknown as TextNode
  const sections: SearchSection[] = []
  let section: SearchSection = {
    text: description ? `${description}\n` : "",
    code: "",
  }
  sections.push(section)
  function visit(node: TextNode) {
    if (
      excluded.has(node.type) ||
      node.tagName === "script" ||
      node.tagName === "style" ||
      node.name === "script" ||
      node.name === "style"
    )
      return
    if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
      section = {
        heading: plain(node).trim(),
        anchor: String(node.properties?.id ?? ""),
        text: "",
        code: "",
      }
      sections.push(section)
      return
    }
    if (node.tagName === "pre") {
      section.code += `${plain(node)}\n`
      return
    }
    if (node.type === "text") {
      section.text += node.value ?? ""
      return
    }
    node.children?.forEach(visit)
    // Preserve word boundaries between paragraphs, cells and JSX containers.
    if (
      (node.tagName && blocks.has(node.tagName)) ||
      node.type === "mdxJsxFlowElement"
    )
      section.text += "\n"
  }
  visit(tree)
  return {
    title,
    sections: sections.map((item) => ({
      ...item,
      text: item.text.replace(/\s+/gu, " ").trim(),
      code: item.code.trim(),
    })),
  }
}
