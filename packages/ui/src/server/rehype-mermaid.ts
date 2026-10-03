import type { Root, RootContent } from "hast"

/** Route Mermaid fences before Shiki can turn their source into tokens. */
export function rehypeMermaid() {
  return (tree: Root) => {
    function visit(parent: { children: RootContent[] }) {
      parent.children.forEach((node, index) => {
        const code = "children" in node ? node.children[0] : undefined
        if (
          node.type === "element" &&
          node.tagName === "pre" &&
          code?.type === "element" &&
          code.tagName === "code" &&
          Array.isArray(code.properties.className) &&
          code.properties.className.includes("language-mermaid")
        ) {
          const source = code.children
            .map((child) => (child.type === "text" ? child.value : ""))
            .join("")
            .replace(/\r\n?/g, "\n")
          const meta = (code.data as { meta?: string } | undefined)?.meta
          const title = meta
            ?.match(/(?:^|\s)title=(?:"([^"]*)"|'([^']*)')/)
            ?.slice(1)
            .find((value) => value !== undefined)
          // String-valued JSX attributes preserve source without evaluating it.
          const replacement = {
            type: "mdxJsxFlowElement" as const,
            name: "MermaidView",
            attributes: [
              {
                type: "mdxJsxAttribute" as const,
                name: "source",
                value: source,
              },
              ...(title === undefined
                ? []
                : [
                    {
                      type: "mdxJsxAttribute" as const,
                      name: "title",
                      value: title,
                    },
                  ]),
            ],
            children: [],
          }
          parent.children[index] = replacement
          return
        }
        if ("children" in node) visit(node)
      })
    }
    visit(tree)
  }
}
