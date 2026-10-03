import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, {
  fsCache: false,
  jsx: { runtime: "automatic" },
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { extractSearchDocument } = await jiti.import(
  "../src/server/search-extract.ts"
)
const { buildDocsSearchIndex, indexSearchPages } = await jiti.import(
  "../src/server/search-index.ts"
)
const { createDocsSearchHandler, loadSearchDatabase, querySearchDatabase } =
  await jiti.import("../src/server/docs-search.ts")
const { renderDoc } = await jiti.import("../src/server/render-doc.tsx")
const { renderToStaticMarkup } = await import("react-dom/server")

function page(id, title, text, code = "", heading = "Setup") {
  return {
    id,
    title,
    url: `/docs/${id}`,
    order: Number(id) || 0,
    sections: [{ heading, anchor: "setup", text, code }],
  }
}

test("extracts frontmatter, tables, nested JSX text and code without executing MDX", () => {
  const source =
    '---\ntitle: Auth guide\n---\n\nimport secret from "private"\n\n## Install\n\n<Hint secret="doNotIndex">Readable **content** {doNotExecute()}</Hint>\n\n| Key | Value |\n| --- | --- |\n| visible | table |\n\n```ts\nconst readDoc = process.env.API_KEY\n```\n\n{/* hiddenComment */}\n\n<script>hiddenScript</script>'
  const extracted = extractSearchDocument({
    content: source,
    extension: ".mdx",
    title: "Fallback",
  })
  assert.equal(extracted.title, "Auth guide")
  assert.equal(extracted.sections[1].anchor, "install")
  const text = JSON.stringify(extracted)
  assert.match(text, /Readable content/)
  assert.match(text, /visible table/)
  assert.match(text, /readDoc/)
  assert.doesNotMatch(
    text,
    /doNotIndex|doNotExecute|private|hiddenComment|hiddenScript/
  )
})

test("visible descriptions and inline word fragments are indexed as rendered text", () => {
  const extracted = extractSearchDocument({
    content:
      "---\ndescription: Summaryword\n---\n\nauto**config**ure and `API_KEY`.",
    extension: ".mdx",
    title: "Guide",
  })
  assert.equal(
    extracted.sections[0].text,
    "Summaryword autoconfigure and API_KEY."
  )
})

test("search anchors match rendered headings, including duplicates and explicit reserved IDs", async () => {
  const doc = {
    content: '<div id="setup" />\n\n## Setup\n\nFirst\n\n## Setup\n\nSecond',
    extension: ".mdx",
    title: "Guide",
    slug: "/guide",
  }
  const extracted = extractSearchDocument(doc)
  const rendered = await renderDoc(doc)
  const html = renderToStaticMarkup(rendered.content)
  for (const section of extracted.sections.filter(
    (section) => section.anchor
  )) {
    assert.ok(html.includes(`id="${section.anchor}"`), section.anchor)
  }
  assert.deepEqual(
    extracted.sections.slice(1).map((section) => section.anchor),
    ["setup-1", "setup-2"]
  )
})

test("ranking, AND matching, short queries, prefixes, code identifiers and page limits", () => {
  const pages = [
    page("0", "Authentication", "ordinary guide", "const readDoc = API_KEY"),
    page("1", "Guide", "authentication permissions", "", "Installation"),
    page("2", "Notes", "unrelated note", "", "Authentication"),
    ...Array.from({ length: 25 }, (_, index) =>
      page(String(index + 3), "Common guide", "commonword")
    ),
  ]
  const database = loadSearchDatabase(indexSearchPages(pages, "en"))
  const search = (query) => querySearchDatabase(database, query).results
  assert.equal(search("authentication")[0].id, "0")
  assert.deepEqual(
    search("authentication permissions").map((result) => result.id),
    ["1"]
  )
  assert.deepEqual(
    search("a").map((result) => result.id),
    ["0", "2"]
  )
  assert.equal(search("auth")[0].id, "0")
  assert.equal(search("ordinary")[0].type, "text")
  assert.equal(search("ordinary")[0].url, "/docs/0#setup")
  assert.equal(search("read doc")[0].type, "code")
  assert.equal(search("API_KEY")[0].id, "0")
  assert.equal(search("commonword").length, 20)
  assert.equal(
    new Set(search("commonword").map((result) => result.id)).size,
    20
  )
  assert.equal(search("authentcation").length, 0)
  assert.equal(search("???").length, 0)
})

test("Chinese single-character queries only match headings and Unicode snippets stay bounded", () => {
  const database = loadSearchDatabase(
    indexSearchPages(
      [
        page(
          "0",
          "主题配置",
          "配置主题颜色。",
          "const ThemeProvider = true",
          "主题设置"
        ),
        page("1", "指南", "正文讨论主题与颜色。", "", "开始"),
      ],
      "zh-CN"
    )
  )
  assert.deepEqual(
    querySearchDatabase(database, "题").results.map((result) => result.id),
    ["0"]
  )
  assert.ok(
    querySearchDatabase(database, "颜色").results.some(
      (result) => result.id === "1"
    )
  )
  const wide = loadSearchDatabase(
    indexSearchPages(
      [page("0", "Unicode", `${"😀".repeat(200)} ＡＰＩ ${"😀".repeat(200)}`)],
      "en"
    )
  )
  const result = querySearchDatabase(wide, "API").results[0]
  assert.ok([...result.snippet].length <= 160)
  assert.equal(
    result.snippet.slice(result.highlights[0].start, result.highlights[0].end),
    "ＡＰＩ"
  )
  const accents = loadSearchDatabase(
    indexSearchPages([page("0", "Menu", "Cafe\u0301 menu")], "en")
  )
  const accentedResult = querySearchDatabase(accents, "café").results[0]
  assert.equal(
    accentedResult.snippet.slice(
      accentedResult.highlights[0].start,
      accentedResult.highlights[0].end
    ),
    "Cafe\u0301"
  )
})

async function fixture(t, i18n = true) {
  const cwd = await mkdtemp(join(tmpdir(), "codealtas-search-"))
  t.after(() => rm(cwd, { recursive: true, force: true }))
  await mkdir(join(cwd, "content", "guide"), { recursive: true })
  const config = {
    title: "Test",
    description: "Test",
    logo: "/logo.png",
    docs: {
      search: {},
      ...(i18n
        ? {
            i18n: {
              defaultLocale: "en",
              locales: { en: { label: "English" }, "zh-CN": { label: "中文" } },
            },
          }
        : {}),
      categories: [
        {
          name: "Guide",
          icon: "book",
          slug: "guide",
          docs: [
            { name: "Home", slug: "index", i18n: { "zh-CN": "首页" } },
            { name: "Fallback", slug: "fallback" },
            {
              name: "Draft",
              draft: true,
              docs: [{ name: "Hidden", slug: "draft" }],
            },
            {
              name: "Disabled",
              disabled: true,
              docs: [{ name: "Hidden", slug: "disabled" }],
            },
          ],
        },
      ],
    },
  }
  await writeFile(join(cwd, "codealtas.config.json"), JSON.stringify(config))
  await writeFile(
    join(cwd, "content/guide/index.mdx"),
    "---\ntitle: English title\n---\n\n## Setup\n\nEnglishOnlyword"
  )
  await writeFile(
    join(cwd, "content/guide/index.zh-CN.mdx"),
    "---\ntitle: 中文标题\n---\n\n## 设置\n\n中文专属词"
  )
  await writeFile(join(cwd, "content/guide/fallback.mdx"), "FallbackOnlyword")
  return { cwd, config }
}

const request = (q, locale) =>
  new Request(
    `http://localhost/api/search?${new URLSearchParams({ q, ...(locale ? { locale } : {}) })}`
  )

test("build and production API strictly isolate languages and exclude hidden/fallback content", async (t) => {
  const { cwd } = await fixture(t)
  const stats = await buildDocsSearchIndex({ cwd })
  assert.deepEqual(
    stats.map(({ locale, pages }) => [locale, pages]),
    [
      ["en", 2],
      ["zh-CN", 1],
    ]
  )
  const handler = createDocsSearchHandler({ cwd, development: false })
  const responses = await Promise.all(
    Array.from({ length: 8 }, () => handler(request("EnglishOnlyword", "en")))
  )
  assert.ok(responses.every((response) => response.status === 200))
  assert.equal((await responses[0].json()).results[0].title, "English title")
  assert.equal(
    (await (await handler(request("FallbackOnlyword", "zh-CN"))).json()).results
      .length,
    0
  )
  assert.equal(
    (await (await handler(request("中文专属词", "zh-CN"))).json()).results[0]
      .url,
    "/docs/zh-CN/guide#%E8%AE%BE%E7%BD%AE"
  )
  assert.equal((await handler(request("text", "unknown"))).status, 400)
  assert.equal((await handler(request("😀".repeat(101), "en"))).status, 400)
  assert.deepEqual(await (await handler(request("", "en"))).json(), {
    results: [],
  })
  // Warm queries must not read source, configuration or index files again.
  await rm(join(cwd, "content"), { recursive: true })
  await rm(join(cwd, ".codealtas"), { recursive: true })
  await rm(join(cwd, "codealtas.config.json"))
  assert.equal((await handler(request("EnglishOnlyword", "en"))).status, 200)
})

test("disabled search returns 404 without requiring an index", async (t) => {
  const { cwd, config } = await fixture(t, false)
  config.docs.search = false
  await writeFile(join(cwd, "codealtas.config.json"), JSON.stringify(config))
  const handler = createDocsSearchHandler({ cwd, development: false })
  assert.equal((await handler(request("EnglishOnlyword"))).status, 404)
})

test("no-i18n indexes default content, and missing/incompatible artifacts return 503", async (t) => {
  const { cwd } = await fixture(t, false)
  const handler = createDocsSearchHandler({ cwd, development: false })
  const original = console.error
  console.error = () => {}
  t.after(() => {
    console.error = original
  })
  assert.equal((await handler(request("EnglishOnlyword"))).status, 503)
  await buildDocsSearchIndex({ cwd })
  assert.equal(
    (await (await handler(request("EnglishOnlyword"))).json()).results.length,
    1
  )
  const target = join(cwd, ".codealtas/search/default.json")
  const artifact = JSON.parse(await readFile(target, "utf8"))
  artifact.version = -1
  await writeFile(target, JSON.stringify(artifact))
  const fresh = createDocsSearchHandler({ cwd, development: false })
  assert.equal((await fresh(request("EnglishOnlyword"))).status, 503)
})

test("development refresh observes content edits, additions, deletions and config changes", async (t) => {
  const { cwd, config } = await fixture(t, false)
  const handler = createDocsSearchHandler({ cwd, development: true })
  assert.equal(
    (await (await handler(request("EnglishOnlyword"))).json()).results.length,
    1
  )
  await writeFile(join(cwd, "content/guide/index.mdx"), "Replacementword")
  await writeFile(join(cwd, "content/guide/new.mdx"), "Addedword")
  config.docs.categories[0].docs.push({ name: "Added", slug: "new" })
  await writeFile(join(cwd, "codealtas.config.json"), JSON.stringify(config))
  await new Promise((resolve) => setTimeout(resolve, 1050))
  assert.equal(
    (await (await handler(request("EnglishOnlyword"))).json()).results.length,
    0
  )
  assert.equal(
    (await (await handler(request("Replacementword"))).json()).results.length,
    1
  )
  assert.equal(
    (await (await handler(request("Addedword"))).json()).results.length,
    1
  )
  await rm(join(cwd, "content/guide/new.mdx"))
  config.docs.categories[0].docs.pop()
  await writeFile(join(cwd, "codealtas.config.json"), JSON.stringify(config))
  await new Promise((resolve) => setTimeout(resolve, 1050))
  assert.equal(
    (await (await handler(request("Addedword"))).json()).results.length,
    0
  )
})
