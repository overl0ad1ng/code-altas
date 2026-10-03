interface Node {
  type: string
  name?: string
  value?: string
  lang?: string
  meta?: string | null
  attributes?: { type: string; name?: string; value?: unknown }[]
  children?: Node[]
  position?: { start: { offset?: number }; end: { offset?: number } }
}

/** Preserve authored source before JSX becomes React elements. */
export function remarkPreview() {
  return (tree: Node, file: { value: unknown }) => {
    const source = String(file.value)
    function visit(node: Node) {
      // Visit original children first so nested previews have their own source.
      node.children?.forEach(visit)
      if (node.name !== "Preview" || !node.type.startsWith("mdxJsx")) return
      const children = node.children ?? []
      const start = children[0]?.position?.start.offset
      const end = children.at(-1)?.position?.end.offset
      const raw =
        start !== undefined && end !== undefined ? source.slice(start, end) : ""
      const lines = raw.replace(/\r\n?/g, "\n").split("\n")
      // AST positions already omit indentation on the first line.
      const indent = Math.min(
        ...lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => line.match(/^ */)![0].length)
      )
      const code = lines
        .map((line, index) =>
          index && Number.isFinite(indent) ? line.slice(indent) : line
        )
        .join("\n")
        .trim()
      const highlight = node.attributes?.find(
        (attr) => attr.name === "highlight"
      )?.value
      node.children = [
        ...children,
        {
          type: "mdxJsxFlowElement",
          name: "__CodeAltasPreviewCode",
          attributes: [],
          children: [
            {
              type: "code",
              value: code,
              lang: "tsx",
              meta: typeof highlight === "string" ? highlight : null,
            },
          ],
        },
      ]
    }
    visit(tree)
  }
}
