import { createHeadingId } from "../lib/heading-id"

interface ContentNode {
  type: string
  tagName?: string
  name?: string
  value?: string
  properties?: Record<string, unknown>
  attributes?: { type: string; name?: string; value?: unknown }[]
  children?: ContentNode[]
}

function text(node: ContentNode): string {
  if (node.type === "text") return node.value ?? ""
  if (node.tagName === "img") return String(node.properties?.alt ?? "")
  return (node.children ?? []).map(text).join("")
}

/** Assign anchors at compilation time so direct hash links work before hydration. */
export function rehypeHeadingIds() {
  return (tree: ContentNode) => {
    const used = new Set<string>()
    const headings: ContentNode[] = []
    function visit(node: ContentNode) {
      const id =
        node.properties?.id ??
        node.attributes?.find(
          (attribute) =>
            attribute.type === "mdxJsxAttribute" && attribute.name === "id"
        )?.value
      if (typeof id === "string" && id) used.add(id)
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName ?? ""))
        headings.push(node)
      node.children?.forEach(visit)
    }
    visit(tree)
    for (const heading of headings) {
      heading.properties ??= {}
      if (!heading.properties.id)
        heading.properties.id = createHeadingId(text(heading), used)
    }
  }
}
