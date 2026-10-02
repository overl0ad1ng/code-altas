import assert from "node:assert/strict"
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url)
const { flattenDocs } = await jiti.import("../src/lib/docs-content.ts")
const { DocContentError, loadDocsIndex, readDoc } = await jiti.import(
  "../src/server/docs-content.ts"
)
const { docHref, getDocsCategorySlug, getDocPagination } = await jiti.import(
  "../src/lib/docs-navigation.ts"
)

test("navigation uses canonical document paths and indexed categories at every depth", () => {
  const entries = flattenDocs([
    {
      name: "Start",
      icon: "lamp-icon",
      slug: "index",
      docs: [
        { name: "Home", slug: "index" },
        { name: "Quick", slug: "quickstart" },
      ],
    },
    {
      name: "API",
      icon: "lamp-icon",
      slug: "api",
      docs: [
        { name: "Home", slug: "index" },
        { name: "Nested", slug: "v1/reference" },
      ],
    },
  ])
  assert.deepEqual(
    entries.map((entry) => docHref(entry.slug)),
    ["/docs", "/docs/quickstart", "/docs/api", "/docs/api/v1/reference"]
  )
  const categories = ["index", "api"].map((slug) => ({
    slug,
    hrefs: entries
      .filter((entry) => entry.categorySlug === slug)
      .map((entry) => docHref(entry.slug)),
  }))
  assert.equal(getDocsCategorySlug("/docs", categories), "index")
  assert.equal(getDocsCategorySlug("/docs/quickstart", categories), "index")
  assert.equal(getDocsCategorySlug("/docs/api/?q=test", categories), "api")
  assert.equal(getDocsCategorySlug("/docs/api/v1/reference", categories), "api")
  assert.equal(getDocsCategorySlug("/docs/unknown", categories), null)
  assert.equal(getDocsCategorySlug(null, categories), null)
})

const category = (slug, docs) => ({ name: slug, icon: "lamp-icon", slug, docs })
const page = (slug, extra = {}) => ({ name: slug, slug, ...extra })

test("pagination follows config order across categories and handles both boundaries", () => {
  const entries = flattenDocs([
    category("index", [
      page("index", { name: "Introduction" }),
      page("quickstart", { name: "Quick Start" }),
    ]),
    category("api", [
      {
        name: "Group",
        docs: [page("index", { name: "API" }), page("v1/reference")],
      },
    ]),
  ])
  assert.deepEqual(getDocPagination(entries, "/"), {
    previous: null,
    next: { href: "/docs/quickstart", name: "Quick Start" },
  })
  assert.deepEqual(getDocPagination(entries, "/quickstart"), {
    previous: { href: "/docs", name: "Introduction" },
    next: { href: "/docs/api", name: "API" },
  })
  assert.deepEqual(
    getDocPagination(entries, "/api"),
    getDocPagination(entries, "/api/")
  )
  assert.deepEqual(getDocPagination(entries, "/api/v1/reference"), {
    previous: { href: "/docs/api", name: "API" },
    next: null,
  })
  assert.deepEqual(getDocPagination(entries, "/missing"), {
    previous: null,
    next: null,
  })
  assert.deepEqual(getDocPagination([], "/"), { previous: null, next: null })
})

test("pagination skips inherited draft/disabled targets but supports direct visits to hidden documents", () => {
  const entries = flattenDocs([
    category("index", [
      page("index"),
      { name: "Draft group", draft: true, docs: [page("draft")] },
      { name: "Disabled group", disabled: true, docs: [page("disabled")] },
      page("last"),
    ]),
  ])
  assert.deepEqual(getDocPagination(entries, "/draft"), {
    previous: { href: "/docs", name: "index" },
    next: { href: "/docs/last", name: "last" },
  })
  assert.deepEqual(getDocPagination(entries, "/").next, {
    href: "/docs/last",
    name: "last",
  })
  assert.deepEqual(getDocPagination(entries, "/last").previous, {
    href: "/docs",
    name: "index",
  })
  assert.deepEqual(
    getDocPagination(
      entries.filter((entry) => entry.draft || entry.disabled),
      "/draft"
    ),
    { previous: null, next: null }
  )
  assert.deepEqual(getDocPagination(entries.slice(0, 1), "/"), {
    previous: null,
    next: null,
  })
})

async function fixture(t, categories) {
  const prefix = resolve(tmpdir(), "codeatlas-content-")
  const cwd = await mkdtemp(prefix)
  t.after(async () => {
    assert.ok(
      isAbsolute(cwd) && cwd.startsWith(prefix) && cwd.length > prefix.length
    )
    await rm(cwd, { recursive: true, force: true })
  })
  await writeFile(
    join(cwd, "codealtas.config.ts"),
    `export default ${JSON.stringify({ title: "Test", description: "Test", logo: "/logo.png", docs: { categories } })}`
  )
  const put = async (path, content) => {
    const fullPath = resolve(cwd, "content", path)
    assert.ok(!relative(resolve(cwd, "content"), fullPath).startsWith(".."))
    await mkdir(resolve(fullPath, ".."), { recursive: true })
    await writeFile(fullPath, content, "utf8")
  }
  return { cwd, put }
}

test("flattens ordered leaves, omits index from URLs, and retains disk paths", () => {
  const entries = flattenDocs([
    category("index", [
      { name: "Start", docs: [page("index"), page("quickstart")] },
    ]),
    category("api", [
      page("index"),
      {
        name: "Versions",
        slug: "index",
        docs: [
          { name: "v1", slug: "v1", docs: [page("index"), page("reference")] },
        ],
      },
    ]),
  ])
  assert.deepEqual(
    entries.map((entry) => entry.slug),
    ["/", "/quickstart", "/api/", "/api/v1/", "/api/v1/reference"]
  )
  assert.deepEqual(
    entries.map((entry) => entry.contentPath),
    [
      "index/index",
      "index/quickstart",
      "api/index",
      "api/index/v1/index",
      "api/index/v1/reference",
    ]
  )
  assert.equal(entries[2].categorySlug, "api")
  assert.equal(entries[1].title, "quickstart")
})

test("parent group slugs are shared by document URLs, content paths, and pagination", async (t) => {
  const { cwd, put } = await fixture(t, [
    category("index", [
      {
        name: "Writting",
        slug: "writting",
        docs: [
          page("md-and-mdx", { name: "MD and MDX" }),
          page("frontmatter", { name: "Frontmatter" }),
          {
            name: "Advanced",
            slug: "advanced",
            docs: [page("index"), page("components")],
          },
        ],
      },
    ]),
  ])
  await put("index/writting/md-and-mdx.mdx", "Writing with MDX")
  await put("index/writting/frontmatter.md", "Frontmatter guide")
  await put("index/writting/advanced/index.mdx", "Advanced overview")
  await put("index/writting/advanced/components.mdx", "Advanced components")
  const entries = await loadDocsIndex(cwd)
  assert.deepEqual(
    entries.map((entry) => docHref(entry.slug)),
    [
      "/docs/writting/md-and-mdx",
      "/docs/writting/frontmatter",
      "/docs/writting/advanced",
      "/docs/writting/advanced/components",
    ]
  )
  for (const entry of entries) {
    const result = await readDoc(entry.slug, cwd)
    assert.equal(
      result.contentPath,
      `index${entry.slug.replace(/\/$/, "/index")}`
    )
  }
  assert.deepEqual(getDocPagination(entries, "/writting/md-and-mdx"), {
    previous: null,
    next: { href: "/docs/writting/frontmatter", name: "Frontmatter" },
  })
  await assert.rejects(
    readDoc("/md-and-mdx", cwd),
    (error) => error.code === "DOCUMENT_NOT_CONFIGURED"
  )
})

test("retains draft/disabled leaves and inherits flags from groups", () => {
  const entries = flattenDocs([
    category("index", [
      { name: "Private", draft: true, docs: [page("draft", { draft: false })] },
      {
        name: "Disabled",
        disabled: true,
        docs: [page("disabled", { disabled: false })],
      },
      page("normal"),
      { name: "Empty group", docs: [] },
    ]),
  ])
  assert.deepEqual(
    entries.map(({ draft, disabled }) => [draft, disabled]),
    [
      [true, false],
      [false, true],
      [false, false],
    ]
  )
})

test("rejects duplicate canonical slugs, including directory-home collisions", () => {
  assert.throws(
    () =>
      flattenDocs([
        category("index", [page("api")]),
        category("api", [page("index")]),
      ]),
    /Duplicate document slug/
  )
  assert.throws(
    () =>
      flattenDocs([
        category("index", [page("quickstart"), page("quickstart")]),
      ]),
    /Duplicate document slug/
  )
})

test("rejects traversal and nonportable filesystem slug segments", () => {
  for (const slug of [
    "../escape",
    "api/../escape",
    "api\\escape",
    "C:/escape",
    "./escape",
    "api?query",
    "api#heading",
  ]) {
    assert.throws(
      () => flattenDocs([category("index", [page(slug)])]),
      /Invalid document slug/
    )
  }
  assert.throws(
    () => flattenDocs([category("../escape", [page("index")])]),
    /Invalid document slug/
  )
})

test("indexing does not read files and reading rejects unconfigured/missing content", async (t) => {
  const { cwd } = await fixture(t, [
    category("index", [page("index")]),
    category("api", [page("index")]),
  ])
  assert.equal((await loadDocsIndex(cwd)).length, 2)
  await assert.rejects(
    readDoc("/unknown", cwd),
    (error) =>
      error instanceof DocContentError &&
      error.code === "DOCUMENT_NOT_CONFIGURED"
  )
  await assert.rejects(
    readDoc("/", cwd),
    (error) =>
      error instanceof DocContentError &&
      error.code === "CONTENT_DIRECTORY_NOT_FOUND"
  )
  await mkdir(join(cwd, "content"))
  await assert.rejects(
    readDoc("/api/", cwd),
    (error) =>
      error instanceof DocContentError &&
      error.code === "CONTENT_FILE_NOT_FOUND"
  )
  await assert.rejects(readDoc("/../escape", cwd), /Invalid document slug/)
})

test("reads MD/MDX verbatim, supports home aliases, and refreshes edited files", async (t) => {
  const { cwd, put } = await fixture(t, [
    category("index", [page("index"), page("quickstart", { draft: true })]),
    category("api", [page("index", { disabled: true })]),
  ])
  const mdx = "---\ntitle: 首页\n---\n\n你好世界\n<Button>开始</Button>\n"
  await put("index/index.mdx", mdx)
  await put("index/quickstart.md", "# 快速开始\n")
  await put("api/index.mdx", "API 首页")
  const home = await readDoc("/", cwd)
  assert.equal(home.content, mdx)
  assert.equal(home.extension, ".mdx")
  assert.equal((await readDoc("/quickstart", cwd)).extension, ".md")
  assert.equal((await readDoc("/quickstart", cwd)).draft, true)
  assert.equal((await readDoc("/api", cwd)).slug, "/api/")
  assert.equal((await readDoc("/api/", cwd)).disabled, true)
  await put("index/index.mdx", "更新内容")
  assert.equal((await readDoc("/", cwd)).content, "更新内容")
})

test("rejects conflicting extensions and directories masquerading as files", async (t) => {
  const { cwd, put } = await fixture(t, [
    category("index", [page("index"), page("directory")]),
  ])
  await put("index/index.md", "MD")
  await put("index/index.mdx", "MDX")
  await assert.rejects(readDoc("/", cwd), /Ambiguous content/)
  await mkdir(join(cwd, "content/index/directory.md"))
  await assert.rejects(readDoc("/directory", cwd), /not a regular file/)
})

test("rejects symlink/junction targets outside the content root", async (t) => {
  const { cwd } = await fixture(t, [category("api", [page("index")])])
  await mkdir(join(cwd, "content"))
  const outside = join(cwd, "outside")
  await mkdir(outside)
  await writeFile(join(outside, "index.mdx"), "outside content")
  await symlink(
    outside,
    join(cwd, "content/api"),
    process.platform === "win32" ? "junction" : "dir"
  )
  await assert.rejects(readDoc("/api/", cwd), /outside the content directory/)
})

test("reads the repository's existing Chinese homepage", async () => {
  const cwd = fileURLToPath(new URL("../../../apps/web/", import.meta.url))
  const result = await readDoc("/", cwd)
  assert.equal(
    result.content,
    await readFile(join(cwd, "content/index/index.mdx"), "utf8")
  )
  assert.equal(result.contentPath, "index/index")
})
