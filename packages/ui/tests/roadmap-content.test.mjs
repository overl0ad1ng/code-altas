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
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, {
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { loadRoadmapVersions } = await jiti.import(
  "../src/server/roadmap-content.ts"
)

const config = `
goal = "Ship a useful roadmap"
[[groups]]
id = "experience"
title = "Experience"
color = "#14B8A6"
icon = "lucide:files"
[[groups]]
id = "content"
title = "Content"
[[statuses]]
id = "building"
title = "Building"
color = "#F90"
[[statuses]]
id = "shipped"
title = "Shipped"
`
const item = (title = "Version selector", extra = "") => `---
title: ${title}
description: Switch versions
group: experience
status: building
${extra}
---

## Details

- [x] Discover versions
`

async function fixture(t) {
  const cwd = await mkdtemp(join(tmpdir(), "codeatlas-roadmap-"))
  t.after(() => rm(cwd, { recursive: true, force: true }))
  return cwd
}

async function version(cwd, name, toml = config) {
  const dir = join(cwd, "content", "_roadmap_", name)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, "roadmap.toml"), toml)
  return dir
}

test("discovers configured versions numerically and preserves authored definitions", async (t) => {
  const cwd = await fixture(t)
  await version(cwd, "0_2_0")
  await version(cwd, "0_10_0", `title = "Next release"\n${config}`)
  await version(cwd, "invalid")
  const placeholder = join(cwd, "content/_roadmap_/1_0_0")
  await mkdir(placeholder)
  await writeFile(join(placeholder, "roadmap.mdx"), "")
  const versions = await loadRoadmapVersions(cwd)
  assert.deepEqual(
    versions.map((v) => v.version),
    ["v0.10.0", "v0.2.0"]
  )
  assert.equal(versions[0].title, "Next release")
  assert.equal(versions[1].title, "v0.2.0")
  assert.equal(versions[0].goal, "Ship a useful roadmap")
  assert.deepEqual(
    versions[0].groups.map((g) => g.id),
    ["experience", "content"]
  )
  assert.deepEqual(
    versions[0].statuses.map((s) => s.title),
    ["Building", "Shipped"]
  )
  assert.equal(versions[0].groups[0].icon, "lucide:files")
  assert.equal(await readFile(join(placeholder, "roadmap.mdx"), "utf8"), "")
})

test("missing roots, empty roots and configured empty versions are supported", async (t) => {
  const cwd = await fixture(t)
  assert.deepEqual(await loadRoadmapVersions(cwd), [])
  await mkdir(join(cwd, "content/_roadmap_"), { recursive: true })
  assert.deepEqual(await loadRoadmapVersions(cwd), [])
  const dir = await version(cwd, "0_1_0")
  await writeFile(join(dir, "blank.mdx"), " \n")
  assert.deepEqual((await loadRoadmapVersions(cwd))[0].items, [])
})

test("reads only direct MDX items, validates metadata and sorts by order then filename", async (t) => {
  const cwd = await fixture(t)
  const dir = await version(cwd, "0_1_0")
  await writeFile(join(dir, "b.mdx"), item("B", "order: 10"))
  await writeFile(join(dir, "a.mdx"), item("A", "order: 10"))
  await writeFile(join(dir, "first.mdx"), item("First"))
  await writeFile(join(dir, "ignored.md"), "not an item")
  await mkdir(join(dir, "nested"))
  await writeFile(join(dir, "nested/ignored.mdx"), "not an item")
  const [result] = await loadRoadmapVersions(cwd)
  assert.deepEqual(
    result.items.map((i) => i.id),
    ["first", "a", "b"]
  )
  assert.equal(result.items[0].order, 0)
  assert.equal(result.items[0].group, "experience")
  assert.equal(result.items[0].status, "building")
  assert.equal(result.items[0].description, "Switch versions")
  assert.match(result.items[0].content, /## Details/)
})

test("reads card properties, calendar dates and GitHub participants from MDX", async (t) => {
  const cwd = await fixture(t)
  const dir = await version(cwd, "0_1_0")
  await writeFile(
    join(dir, "card.mdx"),
    item(
      "Card",
      `priority: High
due: "2026-11-15"
assignees: [octocat, 583231]
properties:
  Area: Documentation
  Estimate: 3
  Reviewed: false`
    )
  )
  const [result] = await loadRoadmapVersions(cwd)
  assert.equal(result.items[0].priority, "High")
  assert.equal(result.items[0].due, "2026-11-15")
  assert.deepEqual(result.items[0].assignees, ["octocat", 583231])
  assert.deepEqual(result.items[0].properties, {
    Area: "Documentation",
    Estimate: 3,
    Reviewed: false,
  })
})

for (const [name, source, field] of [
  ["invalid TOML", "[[groups]", "TOML"],
  [
    "empty groups",
    config.replace(
      /\[\[groups\]\][\s\S]*?(?=\[\[statuses\]\])/,
      "groups = []\n"
    ),
    "groups",
  ],
  [
    "duplicate group ID",
    config.replace('id = "content"', 'id = "experience"'),
    "groups[1].id",
  ],
  [
    "duplicate status ID",
    config.replace('id = "shipped"', 'id = "building"'),
    "statuses[1].id",
  ],
  [
    "invalid ID",
    config.replace('id = "content"', 'id = "Bad ID"'),
    "groups[1].id",
  ],
  ["invalid color", config.replace('"#14B8A6"', '"red"'), "groups[0].color"],
  ["invalid title type", `title = 7\n${config}`, "title"],
  [
    "invalid icon type",
    config.replace('"lucide:files"', "false"),
    "groups[0].icon",
  ],
]) {
  test(`rejects ${name} with configuration path and field`, async (t) => {
    const cwd = await fixture(t)
    const dir = await version(cwd, "0_1_0", source)
    await assert.rejects(loadRoadmapVersions(cwd), (error) => {
      assert.ok(error.message.includes(join(dir, "roadmap.toml")))
      assert.ok(error.message.includes(field), error.message)
      return true
    })
  })
}

for (const [name, source, field] of [
  [
    "unknown group",
    item().replace("group: experience", "group: missing"),
    "group",
  ],
  [
    "unknown status",
    item().replace("status: building", "status: missing"),
    "status",
  ],
  ["missing title", item().replace("title: Version selector\n", ""), "title"],
  ["invalid order", item("Item", "order: 1.5"), "order"],
  ["null order", item("Item", "order: null"), "order"],
  ["impossible due date", item("Item", 'due: "2026-02-30"'), "due"],
  ["invalid priority", item("Item", "priority: []"), "priority"],
  [
    "invalid GitHub username",
    item("Item", "assignees: [../someone]"),
    "assignees[0]",
  ],
  ["invalid GitHub numeric ID", item("Item", "assignees: [0]"), "assignees[0]"],
  [
    "invalid extra property",
    item("Item", "properties:\n  Estimate: [1, 2]"),
    "properties.Estimate",
  ],
  [
    "invalid description",
    item().replace("description: Switch versions", "description: []"),
    "description",
  ],
  [
    "invalid YAML",
    item().replace("title: Version selector", "title: [broken"),
    "frontmatter",
  ],
  ["missing frontmatter", "# No metadata", "title"],
]) {
  test(`rejects ${name} with item path and field`, async (t) => {
    const cwd = await fixture(t)
    const dir = await version(cwd, "0_1_0")
    await writeFile(join(dir, "item.mdx"), source)
    await assert.rejects(loadRoadmapVersions(cwd), (error) => {
      assert.ok(error.message.includes(join(dir, "item.mdx")))
      assert.ok(error.message.includes(field), error.message)
      return true
    })
  })
}

test("rejects a version directory junction escaping the roadmap root", async (t) => {
  const cwd = await fixture(t)
  const outside = await fixture(t)
  await writeFile(join(outside, "roadmap.toml"), config)
  const root = join(cwd, "content/_roadmap_")
  await mkdir(root, { recursive: true })
  await symlink(outside, join(root, "0_1_0"), "junction")
  await assert.rejects(loadRoadmapVersions(cwd), /outside.*directory/i)
})

test("rejects a roadmap root junction escaping the content directory", async (t) => {
  const cwd = await fixture(t)
  const outside = await fixture(t)
  await mkdir(join(cwd, "content"))
  await symlink(outside, join(cwd, "content/_roadmap_"), "junction")
  await assert.rejects(loadRoadmapVersions(cwd), /outside.*directory/i)
})
