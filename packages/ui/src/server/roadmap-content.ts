import "server-only"

import { readdir, readFile, realpath, stat } from "node:fs/promises"
import { isAbsolute, join, relative, sep } from "node:path"
import { parseRoadmapConfig, parseRoadmapItem } from "./roadmap-schema"

function isMissing(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
}

/** Check physical paths too, so symlinks cannot escape the content boundary. */
async function containedPath(root: string, path: string) {
  const physical = await realpath(path)
  const child = relative(root, physical)
  if (child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    throw new Error(`Roadmap path is outside the content directory: ${path}`)
  }
  return physical
}

async function roadmapRoot(cwd: string) {
  try {
    const content = await realpath(join(cwd, "content"))
    return await containedPath(content, join(content, "_roadmap_"))
  } catch (error) {
    if (isMissing(error)) return undefined
    throw error
  }
}

function versionParts(name: string) {
  if (!/^(0|[1-9]\d*)_(0|[1-9]\d*)_(0|[1-9]\d*)$/.test(name)) return undefined
  return name.split("_").map(BigInt)
}

async function readVersion(root: string, id: string) {
  const directory = await containedPath(root, join(root, id))
  if (!(await stat(directory)).isDirectory()) return undefined
  const configPath = join(directory, "roadmap.toml")
  let source: string
  try {
    source = await readFile(await containedPath(directory, configPath), "utf8")
  } catch (error) {
    if (isMissing(error)) return undefined
    throw error
  }
  const version = `v${id.replaceAll("_", ".")}`
  const config = parseRoadmapConfig(source, configPath, version)
  // Physical paths are opaque to tracing; the route explicitly includes Roadmap content.
  const entries = await readdir(/* turbopackIgnore: true */ directory, {
    withFileTypes: true,
  })
  const items = await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.name.endsWith(".mdx") &&
          (entry.isFile() || entry.isSymbolicLink())
      )
      .map(async (entry) => {
        const path = join(directory, entry.name)
        const content = await readFile(
          await containedPath(directory, path),
          "utf8"
        )
        if (!content.trim()) return undefined
        return {
          id: entry.name.slice(0, -4),
          path,
          content,
          ...parseRoadmapItem(content, path, config),
        }
      })
  )
  return {
    id,
    version,
    ...config,
    items: items
      .filter((item) => item !== undefined)
      .sort(
        (a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      ),
  }
}

export type RoadmapVersion = NonNullable<
  Awaited<ReturnType<typeof readVersion>>
>

/** Discover local Roadmap versions without registering them in site config. */
export async function loadRoadmapVersions(
  cwd = process.cwd()
): Promise<RoadmapVersion[]> {
  const root = await roadmapRoot(cwd)
  if (!root) return []
  const entries = await readdir(/* turbopackIgnore: true */ root, {
    withFileTypes: true,
  })
  const candidates = entries
    .filter(
      (entry) =>
        (entry.isDirectory() || entry.isSymbolicLink()) &&
        versionParts(entry.name)
    )
    .sort((a, b) => {
      const left = versionParts(a.name)!
      const right = versionParts(b.name)!
      for (let index = 0; index < 3; index++) {
        if (left[index]! !== right[index]!)
          return left[index]! > right[index]! ? -1 : 1
      }
      return 0
    })
  const versions = await Promise.all(
    candidates.map((entry) => readVersion(root, entry.name))
  )
  return versions.filter((version) => version !== undefined)
}
