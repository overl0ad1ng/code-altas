import assert from "node:assert/strict"
import test from "node:test"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js"
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js"
import { createJiti } from "jiti"
import { fileURLToPath } from "node:url"

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  fsCache: false,
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { DocsNav } = await jiti.import("../src/ui/navigation/docs-nav.tsx")
const { ConfigProvider } = await jiti.import("../src/lib/config-provider.tsx")
const categories = (count) =>
  Array.from({ length: count }, (_, index) => ({
    name: `Category ${index}`,
    slug: `category-${index}`,
    icon: "lucide:book",
    docs: [{ name: "Page", slug: "page" }],
  }))
function render(items, mobile = false) {
  return renderToStaticMarkup(
    h(
      AppRouterContext.Provider,
      { value: { push() {} } },
      h(
        PathnameContext.Provider,
        { value: "/docs/category-0/page" },
        h(
          ConfigProvider,
          {
            config: {
              title: "Test",
              logo: "",
              description: "",
              docs: { categories: items },
            },
          },
          h(DocsNav, { categories: items, mobile })
        )
      )
    )
  )
}
test("desktop switches from icon navigation to Select at five visible categories", () => {
  const four = render(categories(4))
  const five = render(categories(5))
  assert.ok(four.includes('data-slot="docs-category-indicator"'))
  assert.ok(!four.includes('data-slot="docs-category-select"'))
  assert.ok(five.includes('data-slot="docs-category-select"'))
  assert.ok(!five.includes('data-slot="docs-category-indicator"'))
  assert.match(five, /Category 0/)
})
test("mobile uses Select even for one category and includes the selected category icon", () => {
  const markup = render(categories(1), true)
  assert.ok(markup.includes('data-slot="docs-category-select"'))
  assert.ok(!markup.includes('data-slot="docs-category-indicator"'))
  assert.match(markup, /lucide-book/)
  assert.match(markup, /Category 0/)
})
test("categories with only draft or disabled documents do not count toward the threshold", () => {
  const items = categories(6)
  items[4].docs[0].draft = true
  items[5].docs[0].disabled = true
  const markup = render(items)
  assert.ok(!markup.includes('data-slot="docs-category-select"'))
  assert.ok(markup.includes('data-slot="docs-category-indicator"'))
  assert.ok(!markup.includes('aria-label="Category 4"'))
  assert.ok(!markup.includes('aria-label="Category 5"'))
})
