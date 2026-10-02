import type {
  ConfigDocsCategories,
  ConfigDocsCategoryDocs,
} from "../interface/Config"

export interface DocEntry {
  slug: string
  title: string
  categorySlug: string
  /** POSIX path relative to the content directory, without an extension. */
  contentPath: string
  draft: boolean
  disabled: boolean
}

function slugSegments(slug: string): string[] {
  const segments = slug.split("/").filter(Boolean)
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        /[\x00-\x1f<>:"\\|?*#]/.test(segment)
    )
  ) {
    throw new Error(`Invalid document slug: ${JSON.stringify(slug)}`)
  }
  return segments
}

/** Lookup key only: /api and /api/ identify the same document. */
export function normalizeDocSlug(slug: string): string {
  if (!slug.startsWith("/"))
    throw new Error(`Document slug must start with /: ${slug}`)
  if (/^\/+$/u.test(slug)) return "/"
  return `/${slugSegments(slug).join("/")}`
}

/** Build an ordered index from config; index segments stay in file paths only. */
export function flattenDocs(categories: ConfigDocsCategories): DocEntry[] {
  const entries: DocEntry[] = []
  const seen = new Map<string, string>()

  function visit(
    docs: ConfigDocsCategoryDocs,
    parents: string[],
    categorySlug: string,
    inherited: { draft: boolean; disabled: boolean }
  ) {
    for (const doc of docs) {
      const segments = doc.slug === undefined ? [] : slugSegments(doc.slug)
      const path = [...parents, ...segments]
      const flags = {
        draft: inherited.draft || doc.draft === true,
        disabled: inherited.disabled || doc.disabled === true,
      }
      if (doc.docs?.length) {
        visit(doc.docs, path, categorySlug, flags)
        continue
      }
      if (doc.slug === undefined) continue

      const publicSegments = path.filter((segment) => segment !== "index")
      const isIndex = segments.at(-1) === "index"
      const slug = publicSegments.length
        ? `/${publicSegments.join("/")}${isIndex ? "/" : ""}`
        : "/"
      const contentPath = path.join("/")
      const key = normalizeDocSlug(slug)
      const previous = seen.get(key)
      if (previous !== undefined) {
        throw new Error(
          `Duplicate document slug ${slug}: ${previous} and ${contentPath}`
        )
      }
      seen.set(key, contentPath)
      entries.push({
        slug,
        title: doc.name,
        categorySlug,
        contentPath,
        ...flags,
      })
    }
  }

  for (const category of categories) {
    const segments = slugSegments(category.slug)
    visit(category.docs, segments, segments.join("/"), {
      draft: false,
      disabled: false,
    })
  }
  return entries
}
