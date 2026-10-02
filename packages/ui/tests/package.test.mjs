import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, readdir, readFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const root = fileURLToPath(new URL("../", import.meta.url))
const manifest = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8")
)
const tarball = path.resolve(
  root,
  "../../.release",
  `code-altas-ui-${manifest.version}.tgz`
)
const unpacked = await mkdtemp(path.join(os.tmpdir(), "code-altas-package-"))
execFileSync("tar", ["-xf", tarball, "-C", unpacked])
const packageRoot = path.join(unpacked, "package")
const packed = JSON.parse(
  await readFile(path.join(packageRoot, "package.json"), "utf8")
)

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name)
        return entry.isDirectory() ? files(target) : target
      })
    )
  ).flat()
}

test("tarball exports compiled JS, declarations and standalone CSS", async () => {
  assert.equal(packed.version, "0.1.0-beta")
  assert.equal(packed.private, undefined)
  assert.equal(packed.license, "MIT")
  assert.match(
    await readFile(path.join(packageRoot, "LICENSE"), "utf8"),
    /MIT License/
  )
  assert.equal(packed.publishConfig.tag, "beta")
  assert.equal(packed.publishConfig.access, "public")
  assert.equal(packed.main, "./dist/index.js")
  assert.equal(packed.types, "./dist/index.d.ts")
  for (const value of Object.values(packed.exports)) {
    for (const target of typeof value === "string"
      ? [value]
      : Object.values(value)) {
      assert.ok(
        (await readFile(path.join(packageRoot, target))).length > 0,
        target
      )
    }
  }
  const css = await readFile(
    path.join(packageRoot, packed.exports["./styles.css"]),
    "utf8"
  )
  assert.doesNotMatch(css, /@(?:import|tailwind|apply|source)\b/)
  assert.ok(css.includes(".sticky"))
  assert.ok(css.includes(".grid"))
  assert.equal(packed.dependencies.react, undefined)
  assert.equal(packed.dependencies["react-dom"], undefined)
  assert.ok(packed.peerDependencies.react)
  assert.ok(packed.peerDependencies["react-dom"])
})

test("tarball excludes workspace sources, tests and build configuration", async () => {
  const paths = (await files(packageRoot)).map((file) =>
    path.relative(packageRoot, file).replaceAll("\\", "/")
  )
  for (const file of paths)
    assert.match(file, /^(dist\/|package\.json$|README\.md$|LICENSE$)/)
  assert.ok(paths.some((file) => file.endsWith(".d.ts")))
})

test("compiled modules preserve client directives and resolve relative imports", async () => {
  for (const file of (await files(path.join(root, "src"))).filter((file) =>
    /\.tsx?$/.test(file)
  )) {
    const source = await readFile(file, "utf8")
    const emitted = path.join(
      packageRoot,
      "dist",
      path.relative(path.join(root, "src"), file).replace(/\.tsx?$/, ".js")
    )
    if (/^['"]use client['"]/.test(source))
      assert.match(await readFile(emitted, "utf8"), /^"use client";/)
  }
  for (const file of (await files(path.join(packageRoot, "dist"))).filter(
    (file) => /\.(js|ts)$/.test(file)
  )) {
    const source = await readFile(file, "utf8")
    for (const match of source.matchAll(
      /(?:from\s+|import\s*\(?\s*)["'](\.[^"']+)["']/g
    )) {
      assert.match(match[1], /\.(js|css)$/)
      const target = path.resolve(path.dirname(file), match[1])
      assert.ok((await readFile(target)).length > 0, target)
    }
  }
})
