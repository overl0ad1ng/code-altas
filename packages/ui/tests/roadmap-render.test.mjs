import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  fsCache: false,
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { RoadmapPage } = await jiti.import("../src/ui/pages/RoadmapPage.tsx")
const { ReleaseLink } = await jiti.import("../src/components/roadmap-card.tsx")

test("ReleaseLink renders release URLs and shorthand with domain labels and brand icons", () => {
  const cases = [
    [
      "github:overl0ad1ng/code-altas",
      "https://github.com/overl0ad1ng/code-altas",
      "github.com",
      "GitHub",
    ],
    [
      "npm:@code-altas/ui",
      "https://www.npmjs.com/package/@code-altas/ui",
      "npmjs.com",
      "npm",
    ],
    ["npm:react", "https://www.npmjs.com/package/react", "npmjs.com", "npm"],
    [
      "https://github.com/overl0ad1ng/code-altas/releases/tag/v1.0.0",
      "https://github.com/overl0ad1ng/code-altas/releases/tag/v1.0.0",
      "github.com",
      "GitHub",
    ],
    [
      "https://www.npmjs.com/package/@code-altas/ui",
      "https://www.npmjs.com/package/@code-altas/ui",
      "npmjs.com",
      "npm",
    ],
    [
      "http://npmjs.com/package/react",
      "http://npmjs.com/package/react",
      "npmjs.com",
      "npm",
    ],
    [
      "https://example.com/releases/v1?tab=notes#changes",
      "https://example.com/releases/v1?tab=notes#changes",
      "example.com",
      null,
    ],
    [
      "http://docs.example.com:8080/releases",
      "http://docs.example.com:8080/releases",
      "docs.example.com",
      null,
    ],
    [
      "https://github.com.example.com/releases",
      "https://github.com.example.com/releases",
      "github.com.example.com",
      null,
    ],
    [
      "https://example.com/github.com",
      "https://example.com/github.com",
      "example.com",
      null,
    ],
  ]

  for (const [text, href, domain, brand] of cases) {
    const html = renderToStaticMarkup(createElement(ReleaseLink, { text }))
    assert.ok(html.includes(`href="${href}"`), text)
    assert.match(html, /target="_blank"/)
    assert.match(html, /rel="noreferrer"/)
    assert.equal(
      html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, "").replace(/<[^>]*>/g, ""),
      domain,
      text
    )
    assert.equal(html.includes("<svg"), brand !== null, text)
    if (brand) {
      assert.ok(html.includes(`<title>${brand}</title>`), text)
      assert.match(html, /aria-hidden="true"/)
    }
  }
})

test("ReleaseLink keeps plain text and malformed URLs readable", () => {
  for (const text of [
    "v1.0.0",
    "Coming soon",
    "https://",
    "http-invalid",
    "javascript:alert(1)",
  ]) {
    const html = renderToStaticMarkup(createElement(ReleaseLink, { text }))
    assert.equal(html, text)
  }
})

async function fixture(t) {
  const previous = process.cwd()
  const cwd = await mkdtemp(join(tmpdir(), "codeatlas-roadmap-render-"))
  process.chdir(cwd)
  t.after(async () => {
    process.chdir(previous)
    await rm(cwd, { recursive: true, force: true })
  })
  const dir = join(cwd, "content/_roadmap_/0_1_0")
  await mkdir(dir, { recursive: true })
  return dir
}

const config = `title = "First release"
goal = "Make planning visible"
[[groups]]
id = "docs"
title = "Documentation"
icon = "lucide:files"
[[groups]]
id = "search"
title = "Search"
[[statuses]]
id = "review"
title = "Under review"
icon = "lucide:not-a-real-icon"
color = "#F90"
`

test("RoadmapPage renders the global empty state without requiring site config", async (t) => {
  await fixture(t)
  const html = renderToStaticMarkup(await RoadmapPage())
  assert.match(html, /<h1[^>]*>Roadmap<\/h1>/)
  assert.match(html, /No roadmap versions/)
})

test("RoadmapPage renders version metadata, authored grouping, status and custom MDX", async (t) => {
  const dir = await fixture(t)
  await writeFile(join(dir, "roadmap.toml"), config)
  await writeFile(
    join(dir, "guide.mdx"),
    `---
title: Authoring guide
description: A clearer workflow
group: docs
status: review
priority: High
due: "2026-11-15"
assignees: [octocat]
properties:
  Area: Documentation
---

**Detailed guidance**

- [x] First draft

<Demo />
`
  )
  const page = await RoadmapPage({
    components: {
      Demo: () => createElement("p", null, "Custom component works"),
    },
  })
  const html = renderToStaticMarkup(page)
  const body = renderToStaticMarkup(page.props.versions[0].items[0].content)
  for (const expected of [
    "First release",
    "v0.1.0",
    "Make planning visible",
    "Documentation",
    "Search",
    "Authoring guide",
    "A clearer workflow",
    "Under review",
    "High",
    "Nov 15",
  ]) {
    assert.ok(html.includes(expected), expected)
  }
  assert.match(html, /data-slot="roadmap-card"/)
  assert.equal((html.match(/data-slot="roadmap-column"/g) ?? []).length, 2)
  assert.match(html, /data-slot="roadmap-preview"/)
  assert.match(html, /github.com\/octocat.png/)
  assert.ok(!html.includes("Custom component works"))
  assert.match(body, /Custom component works/)
  assert.match(body, /<strong>Detailed guidance<\/strong>/)
  assert.match(body, /type="checkbox"[^>]*disabled=""[^>]*checked=""/)
  assert.match(body, /aria-label="Completed task"/)
  assert.match(html, /No items in this group/)
  assert.match(html, /aria-label="Version"/)
  assert.match(html, /<svg/)
})

test("configured versions without items show a version empty state", async (t) => {
  const dir = await fixture(t)
  await writeFile(join(dir, "roadmap.toml"), config)
  const html = renderToStaticMarkup(await RoadmapPage())
  assert.match(html, /First release/)
  assert.match(html, /No roadmap items in this version/)
})
