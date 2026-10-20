import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { createElement, Fragment } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  fsCache: false,
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { defaultDocsComponents } = await jiti.import(
  "../src/ui/mdx/components.tsx"
)
const { renderDoc } = await jiti.import("../src/server/render-doc.tsx")
const { FAQ, Question } = defaultDocsComponents

function renderFAQ(children) {
  assert.equal(typeof FAQ, "function", "FAQ must be registered for MDX")
  assert.equal(
    typeof Question,
    "function",
    "Question must be registered for MDX"
  )
  return renderToStaticMarkup(createElement(FAQ, { children }))
}

test("FAQ starts fully collapsed and accepts an empty group", () => {
  assert.equal(renderFAQ([]), "")
  const html = renderFAQ([
    createElement(Question, { key: "first", title: "First" }, "First answer"),
    createElement(
      Question,
      { key: "second", title: "Second" },
      "Second answer"
    ),
  ])
  assert.equal((html.match(/aria-expanded="false"/g) || []).length, 2)
  assert.doesNotMatch(html, /aria-expanded="true"/)
  assert.match(html, /First answer/)
  assert.match(html, /Second answer/)
})

test("FAQ accepts fragments and selects a non-first defaultOpen question", () => {
  const html = renderFAQ([
    null,
    false,
    "\n",
    createElement(
      Fragment,
      { key: "questions" },
      createElement(Question, { title: "First" }, "First answer"),
      createElement(
        Question,
        { title: "Second", defaultOpen: true, icon: "simple:github" },
        "Second answer"
      )
    ),
  ])
  assert.equal((html.match(/aria-expanded="true"/g) || []).length, 1)
  assert.match(html, /aria-expanded="false"[^>]*>.*?First/s)
  assert.match(html, /aria-expanded="true"[^>]*>.*?Second/s)
  assert.match(html, /<svg/)
  assert.doesNotMatch(html, /data-slot="hint"/)
})

test("FAQ rejects multiple defaultOpen questions, including inside fragments", () => {
  assert.throws(
    () =>
      renderFAQ([
        createElement(Question, {
          key: "first",
          title: "First",
          defaultOpen: true,
        }),
        createElement(
          Fragment,
          { key: "fragment" },
          createElement(Question, { title: "Second", defaultOpen: true })
        ),
      ]),
    /FAQ only allows one Question with defaultOpen/
  )
})

test("Question cannot render on its own or through an arbitrary wrapper", () => {
  assert.equal(
    typeof Question,
    "function",
    "Question must be registered for MDX"
  )
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(Question, { title: "Standalone" }, "Answer")
      ),
    /Question must be inside FAQ/
  )
  assert.throws(
    () =>
      renderFAQ(
        createElement(
          "div",
          null,
          createElement(Question, { title: "Wrapped" }, "Answer")
        )
      ),
    /FAQ only accepts Question children/
  )
})

test("separate FAQs each accept their own defaultOpen question", () => {
  assert.equal(typeof FAQ, "function", "FAQ must be registered for MDX")
  const html = renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(
        FAQ,
        null,
        createElement(
          Question,
          { title: "First group", defaultOpen: true },
          "One"
        )
      ),
      createElement(
        FAQ,
        null,
        createElement(
          Question,
          { title: "Second group", defaultOpen: true },
          "Two"
        )
      )
    )
  )
  assert.equal((html.match(/aria-expanded="true"/g) || []).length, 2)
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, new Set(ids).size)
  for (const [, controls] of html.matchAll(/aria-controls="([^"]+)"/g)) {
    assert.ok(ids.includes(controls))
  }
})

for (const locale of ["", ".zh-CN"]) {
  test(`FAQ ${locale || "English"} documentation renders through the MDX registry`, async () => {
    assert.equal(typeof FAQ, "function", "FAQ must be registered for MDX")
    const content = await readFile(
      new URL(
        `../../../apps/web/content/components/faq${locale}.mdx`,
        import.meta.url
      ),
      "utf8"
    )
    const result = await renderDoc(
      { content, extension: ".mdx", slug: "components/faq", title: "FAQ" },
      undefined,
      { experimentalComponentsInMDX: true }
    )
    const html = renderToStaticMarkup(result.content)
    assert.match(html, /data-slot="faq"/)
    assert.match(html, /<strong>/)
    assert.match(html, /FAQ Props/)
    assert.match(html, /Question Props/)
    assert.equal((html.match(/aria-expanded="true"/g) || []).length, 1)
  })
}
