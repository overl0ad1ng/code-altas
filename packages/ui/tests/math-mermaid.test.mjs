import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createJiti } from "jiti"
import { fileURLToPath } from "node:url"

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  fsCache: false,
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { renderDoc } = await jiti.import("../src/server/render-doc.tsx")
const { ConfigProvider } = await jiti.import("../src/lib/config-provider.tsx")
const config = { title: "Test", description: "", logo: "/logo.svg" }

async function render(content, extension = ".mdx", components) {
  const result = await renderDoc(
    { content, extension, slug: "/example", title: "Example" },
    components
  )
  return renderToStaticMarkup(
    createElement(ConfigProvider, { config }, result.content)
  )
}

test("Mermaid fences bypass Shiki and CodeBlock in Markdown and MDX", async () => {
  for (const extension of [".md", ".mdx"]) {
    for (const fence of ["```", "~~~"]) {
      const html = await render(
        `${fence}mermaid title="A diagram"\nflowchart LR\n  A --> B\n${fence}`,
        extension
      )
      assert.match(html, /data-slot="mermaid-view"/)
      assert.match(html, /A diagram/)
      assert.match(html, /Copy Mermaid source/)
      assert.match(html, /Loading diagram/)
      assert.doesNotMatch(html, /<pre|shiki|Copy code/)
    }
  }
})

test("Mermaid source and metadata survive JSX special characters and CRLF", async () => {
  const source = 'flowchart LR\n  A["{value} & <tag> \\ path"] --> B'
  let received
  await render(
    `~~~mermaid title='Quoted title'\r\n${source.replaceAll("\n", "\r\n")}\r\n~~~`,
    ".mdx",
    {
      MermaidView: (props) => {
        received = props
        return null
      },
    }
  )
  assert.equal(received.source, source + "\n")
  assert.equal(received.title, "Quoted title")
})

test("Mermaid diagrams work in CodeGroup and remain distinct from normal fences", async () => {
  const html = await render(
    '<CodeGroup>\n\n```mermaid title="Flow"\nflowchart LR\n A --> B\n```\n\n```ts title="Code"\nconst a = 1\n```\n\n</CodeGroup>'
  )
  assert.match(html, /data-slot="mermaid-view"/)
  assert.match(html, /role="tab"/)
  assert.match(html, />Flow</)
  const mixed = await render(
    "```mermaid\nflowchart LR\n A --> B\n```\n\n```ts\nconst a = 1\n```"
  )
  assert.match(mixed, /shiki/)
  assert.match(mixed, /Copy code/)
  assert.equal((mixed.match(/data-slot="mermaid-view"/g) || []).length, 1)
  await assert.rejects(
    render(
      "<CodeDiff>\n\n```mermaid\nflowchart LR\n A --> B\n```\n\n</CodeDiff>"
    ),
    /CodeDiff does not support Mermaid/
  )
})

test("KaTeX renders inline and block formulas with LaTeX braces in Markdown and MDX", async () => {
  for (const extension of [".md", ".mdx"]) {
    const html = await render(
      "Energy $E = mc^2$.\n\n$$\n\\frac{1}{2} + \\sqrt{x}\n$$",
      extension
    )
    assert.match(html, /class="katex"/)
    assert.match(html, /class="katex-display"/)
    assert.match(html, /<math/)
    assert.match(html, /annotation encoding="application\/x-tex"/)
    assert.doesNotMatch(html, /Copy code|<pre/)
  }
})

test("KaTeX leaves escaped currency and code literal and contains invalid formulas", async () => {
  const literals = await render(
    "Price: \\$5 and \\$2. Inline `$x^2$`.\n\n```text\n$x^2$\n```"
  )
  assert.match(literals, /Price: \$5 and \$2/)
  assert.doesNotMatch(literals, /class="katex"/)
  assert.match(literals, /shiki/)
  const invalid = await render(
    "Before $\\frac{1}{$ after.\n\n$\\notARealCommand{x}$\n\n$\\href{javascript:alert(1)}{click}$"
  )
  assert.match(invalid, /katex-error/)
  assert.match(invalid, /after/)
  assert.doesNotMatch(invalid, /href="javascript:/)
})

test("Writing docs compile without experimental components", async () => {
  for (const name of ["mermaid", "katex"]) {
    const source = await readFile(
      new URL(
        `../../../apps/web/content/index/writting/${name}.mdx`,
        import.meta.url
      ),
      "utf8"
    )
    const html = await render(source)
    assert.match(
      html,
      name === "mermaid" ? /data-slot="mermaid-view"/ : /class="katex-display"/
    )
  }
})
