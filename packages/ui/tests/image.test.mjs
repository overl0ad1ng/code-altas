import assert from "node:assert/strict"
import test from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createJiti } from "jiti"
import { fileURLToPath } from "node:url"
import { readFile } from "node:fs/promises"

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  fsCache: false,
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { renderDoc } = await jiti.import("../src/server/render-doc.tsx")

async function render(content, extension = ".mdx", components) {
  const result = await renderDoc(
    { content, extension, slug: "/example", title: "Example" },
    components
  )
  return renderToStaticMarkup(result.content)
}

test("Markdown images in MD and MDX have an accessible preview trigger", async () => {
  for (const extension of [".md", ".mdx"]) {
    const html = await render(
      '![Architecture](/diagram.svg "System overview")',
      extension
    )
    assert.match(html, /data-slot="image"/)
    assert.match(html, /aria-haspopup="dialog"/)
    assert.match(html, /aria-label="Enlarge image: Architecture"/)
    assert.match(html, /alt="Architecture"/)
    assert.match(html, /src="\/diagram.svg"/)
    assert.match(html, /title="System overview"/)
    assert.doesNotMatch(html, /<p[^>]*>\s*<(?:div|figure)/)
  }
})

test("Image is available in MDX with captions and native image attributes", async () => {
  const html = await render(
    '<Image src="/diagram.svg" alt="Architecture" caption="System overview" width={960} height={540} loading="eager" className="custom-image" />'
  )
  assert.match(html, /data-slot="image-caption"/)
  assert.match(html, /System overview/)
  assert.match(html, /width="960"/)
  assert.match(html, /height="540"/)
  assert.match(html, /loading="eager"/)
  assert.match(html, /custom-image/)
})

test("empty image alt text is preserved with a named preview trigger", async () => {
  const html = await render("![](/decorative.svg)")
  assert.match(html, /alt=""/)
  assert.match(html, /aria-label="Enlarge image"/)
})

test("projects can still override the Markdown image component", async () => {
  const html = await render("![Custom](/diagram.svg)", ".mdx", {
    img: (props) => createElement("img", { ...props, "data-custom": "true" }),
  })
  assert.match(html, /data-custom="true"/)
  assert.doesNotMatch(html, /data-slot="image"/)
})

test("linked Markdown images retain navigation without a nested preview button", async () => {
  const html = await render(
    "[![Architecture](/diagram.svg)](/docs/components/faq)"
  )
  assert.match(html, /href="\/docs\/components\/faq"/)
  assert.match(html, /alt="Architecture"/)
  assert.doesNotMatch(html, /<button|aria-haspopup="dialog"/)
})

test("Image can opt out of previews while keeping captions", async () => {
  const html = await render(
    '<Image src="/diagram.svg" alt="Architecture" caption="Overview" zoomable={false} />'
  )
  assert.match(html, /data-slot="image-caption"/)
  assert.match(html, /Overview/)
  assert.doesNotMatch(html, /<button|zoomable=/)
})

for (const language of ["", ".zh-CN"]) {
  test(`Image ${language || "English"} documentation renders its demo and property table`, async () => {
    const content = await readFile(
      new URL(
        `../../../apps/web/content/components/image${language}.mdx`,
        import.meta.url
      ),
      "utf8"
    )
    const result = await renderDoc(
      { content, extension: ".mdx", slug: "/components/image", title: "Image" },
      undefined,
      { experimentalComponentsInMDX: true }
    )
    const html = renderToStaticMarkup(result.content)
    assert.match(html, /data-slot="image-caption"/)
    assert.match(html, /aria-haspopup="dialog"/)
    assert.match(html, /role="tabpanel"/)
    assert.match(html, /zoomable/)
    assert.match(html, /<table/)
  })
}
