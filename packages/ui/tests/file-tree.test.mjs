import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { renderToStaticMarkup } from "react-dom/server"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  fsCache: false,
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { parseFileTree } = await jiti.import("../src/lib/file-tree.ts")
const { renderDoc } = await jiti.import("../src/server/render-doc.tsx")
const { FileTree } = await jiti.import("../src/ui/mdx/components/file-tree.tsx")

test("merges every root and branch, preserving distinct leaves and input order", () => {
  const nodes = parseFileTree([
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/components/button.tsx",
    "codealtas.config.ts",
    "tests/app/page.tsx",
    "src/app/page.tsx",
  ])
  const paths = []
  function visit(items) {
    for (const node of items) {
      paths.push([node.path, node.type])
      visit(node.children)
    }
  }
  visit(nodes)
  assert.deepEqual(paths, [
    ["src", "directory"],
    ["src/app", "directory"],
    ["src/app/page.tsx", "file"],
    ["src/app/layout.tsx", "file"],
    ["src/components", "directory"],
    ["src/components/button.tsx", "file"],
    ["codealtas.config.ts", "file"],
    ["tests", "directory"],
    ["tests/app", "directory"],
    ["tests/app/page.tsx", "file"],
  ])
})

test("supports Windows paths, dotfiles, extensionless files, and empty directories", () => {
  const nodes = parseFileTree([
    ".\\src\\app\\page.tsx",
    "src//app/page.tsx",
    ".gitignore",
    "LICENSE",
    "empty/",
    "",
  ])
  assert.equal(nodes[0].children[0].children.length, 1)
  assert.equal(nodes[1].type, "file")
  assert.equal(nodes[2].type, "file")
  assert.deepEqual(nodes[3], {
    name: "empty",
    path: "empty",
    type: "directory",
    children: [],
  })
  assert.deepEqual(parseFileTree([]), [])
})

test("reports file/directory collisions in either order and parent traversal", () => {
  for (const files of [
    ["app", "app/page.tsx"],
    ["app/page.tsx", "app"],
  ]) {
    assert.throws(
      () => parseFileTree(files),
      /both a file and a directory: app/
    )
  }
  assert.throws(() => parseFileTree(["../outside.ts"]), /cannot contain/)
})

test("renders the actual layout and page MDX with every root and leaf", async () => {
  const content = await readFile(
    new URL(
      "../../../apps/web/content/index/layout-and-page.mdx",
      import.meta.url
    ),
    "utf8"
  )
  const rendered = await renderDoc({
    slug: "/index/layout-and-page",
    title: "Layout",
    content,
    extension: ".mdx",
  })
  const html = renderToStaticMarkup(rendered.content)
  for (const path of [
    "src",
    "src/app",
    "src/app/(site)",
    "src/app/(site)/[[...slug]]",
    "src/app/(site)/[[...slug]]/page.tsx",
    "src/app/(site)/layout.tsx",
    "src/app/layout.tsx",
    "codealtas.config.ts",
    "content",
    "content/index",
    "content/index/index.mdx",
    "content/index/quickstart.mdx",
  ]) {
    assert.equal(html.split(`data-path="${path}"`).length - 1, 1)
  }
  assert.equal((html.match(/<details open=""/g) || []).length, 6)
  assert.equal((html.match(/<summary /g) || []).length, 6)
})

test("allows initially collapsed directories and renders no empty wrapper", () => {
  const html = renderToStaticMarkup(
    FileTree({ files: ["app/page.tsx"], defaultOpen: false })
  )
  assert.match(html, /<details/)
  assert.doesNotMatch(html, /<details open/)
  assert.equal(renderToStaticMarkup(FileTree({ files: [] })), "")
})
