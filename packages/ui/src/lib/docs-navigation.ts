import { normalizeDocSlug, type DocEntry } from "./docs-content"
import type { ConfigDocsI18N } from "../interface/Config"
import { localizedDocHref } from "./docs-i18n"

export interface DocPageLink {
  href: string
  name: string
}

export interface DocPagination {
  previous: DocPageLink | null
  next: DocPageLink | null
}

/** Follow config order across categories, skipping unpublished navigation entries. */
export function getDocPagination(
  entries: DocEntry[],
  slug: string,
  locale?: string,
  i18n?: ConfigDocsI18N
): DocPagination {
  const key = normalizeDocSlug(slug)
  const current = entries.findIndex(
    (entry) => normalizeDocSlug(entry.slug) === key
  )
  if (current < 0) return { previous: null, next: null }

  const visible = (entry: DocEntry) => !entry.draft && !entry.disabled
  const previous = entries.slice(0, current).reverse().find(visible)
  const next = entries.slice(current + 1).find(visible)
  const link = (entry: DocEntry | undefined): DocPageLink | null =>
    entry
      ? { href: docHref(entry.slug, locale, i18n), name: entry.title }
      : null
  return { previous: link(previous), next: link(next) }
}

export interface DocsCategoryPaths {
  slug: string
  hrefs: string[]
}

export function normalizeDocsPath(pathname: string): string {
  return pathname.split(/[?#]/)[0]?.replace(/\/+$/, "") || "/"
}

export function docHref(
  slug: string,
  locale?: string,
  i18n?: ConfigDocsI18N
): string {
  return normalizeDocsPath(localizedDocHref(slug, locale, i18n))
}

/** Match the indexed document instead of inferring its category from URL depth. */
export function getDocsCategorySlug(
  pathname: string | null,
  categories: DocsCategoryPaths[]
): string | null {
  if (!pathname) return null
  const path = normalizeDocsPath(pathname)
  return (
    categories.find((category) => category.hrefs.includes(path))?.slug ?? null
  )
}
