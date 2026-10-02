import { readFile, realpath, stat } from "node:fs/promises"
import { isAbsolute, relative, resolve, sep } from "node:path"

import {
  flattenDocs,
  normalizeDocSlug,
  type DocEntry,
} from "../lib/docs-content"
import { loadCodeAtlasConfig } from "./config"

export type DocExtension = ".md" | ".mdx"
export type DocContentErrorCode =
  | "DOCUMENT_NOT_CONFIGURED"
  | "CONTENT_DIRECTORY_NOT_FOUND"
  | "CONTENT_FILE_NOT_FOUND"

export class DocContentError extends Error {
  constructor(
    public readonly code: DocContentErrorCode,
    message: string
  ) {
    super(message)
    this.name = "DocContentError"
  }
}
export type ReadDocResult = DocEntry & {
  content: string
  extension: DocExtension
}

function assertContained(root: string, path: string) {
  const child = relative(root, path)
  if (child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    throw new Error(`Content path is outside the content directory: ${path}`)
  }
}

function isMissing(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  )
}

/** Index configured documents without requiring their content files to exist. */
export async function loadDocsIndex(cwd = process.cwd()): Promise<DocEntry[]> {
  const config = await loadCodeAtlasConfig(cwd)
  return flattenDocs(config.docs?.categories ?? [])
}

/** Read UTF-8 source only; Markdown, frontmatter and JSX are returned unchanged. */
export async function readDoc(
  slug: string,
  cwd = process.cwd()
): Promise<ReadDocResult> {
  const key = normalizeDocSlug(slug)
  const entries = await loadDocsIndex(cwd)
  const entry = entries.find((item) => normalizeDocSlug(item.slug) === key)
  if (!entry)
    throw new DocContentError(
      "DOCUMENT_NOT_CONFIGURED",
      `Document slug is not configured: ${slug}`
    )

  const root = resolve(cwd, "content")
  let physicalRoot: string
  try {
    physicalRoot = await realpath(root)
  } catch (error) {
    if (isMissing(error))
      throw new DocContentError(
        "CONTENT_DIRECTORY_NOT_FOUND",
        `Content directory not found: ${root}`
      )
    throw error
  }

  const candidates = await Promise.all(
    ([".md", ".mdx"] as const).map(async (extension) => {
      const path = resolve(root, `${entry.contentPath}${extension}`)
      assertContained(root, path)
      let physicalPath: string
      try {
        physicalPath = await realpath(path)
      } catch (error) {
        if (isMissing(error)) return null
        throw error
      }
      assertContained(physicalRoot, physicalPath)
      if (!(await stat(physicalPath)).isFile()) {
        throw new Error(`Content path is not a regular file: ${path}`)
      }
      return { path: physicalPath, extension }
    })
  )
  const files = candidates.filter((file) => file !== null)
  if (files.length > 1) {
    throw new Error(
      `Ambiguous content for ${entry.slug}: both ${entry.contentPath}.md and .mdx exist`
    )
  }
  const file = files[0]
  if (!file) {
    throw new DocContentError(
      "CONTENT_FILE_NOT_FOUND",
      `Content file not found for ${entry.slug}: expected ${entry.contentPath}.md or .mdx in ${root}`
    )
  }
  return {
    ...entry,
    extension: file.extension,
    content: await readFile(file.path, "utf8"),
  }
}
