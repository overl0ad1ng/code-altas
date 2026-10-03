import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import MiniSearch from "minisearch"
import { flattenDocs } from "../lib/docs-content"
import { localizedDocHref } from "../lib/docs-i18n"
import { loadCodeAtlasConfig } from "./config"
import { readDocEntry } from "./docs-content"
import { extractSearchDocument, type SearchSection } from "./search-extract"

export const SEARCH_VERSION = 1
export const SEARCH_DIRECTORY = ".codealtas/search"

export interface SearchPage {
  id: string
  title: string
  url: string
  order: number
  sections: SearchSection[]
}

export interface SearchArtifact {
  version: number
  locale: string
  pages: SearchPage[]
  full: ReturnType<MiniSearch["toJSON"]>
  titles: ReturnType<MiniSearch["toJSON"]>
}

export function searchTokenizer(locale: string) {
  const segmenter = new Intl.Segmenter(locale === "default" ? "en" : locale, {
    granularity: "word",
  })
  return (text: string, field?: string) => {
    const value = text.normalize("NFKC")
    const words = [...segmenter.segment(value)]
      .filter((item) => item.isWordLike)
      .map((item) => item.segment.toLowerCase())
    if (field === "code") {
      const identifiers =
        value.match(/[\p{L}\p{N}_$]+(?:[.-][\p{L}\p{N}_$]+)*/gu) ?? []
      const extras = identifiers.flatMap((word) => [
        word,
        ...word.replace(/([a-z\d])([A-Z])/g, "$1 $2").split(/[\s_.-]+/u),
      ])
      const seen = new Set(words)
      for (const extra of extras) {
        const word = extra.toLowerCase()
        if (word && !seen.has(word)) {
          words.push(word)
          seen.add(word)
        }
      }
    }
    return words
  }
}

export function searchIndexOptions(locale: string, titles = false) {
  const tokenize = searchTokenizer(locale)
  return {
    fields: titles
      ? ["title", "headings"]
      : ["title", "headings", "text", "code"],
    tokenize: titles
      ? (text: string, field?: string) => [
          ...tokenize(text, field),
          ...(text.match(/\p{Script=Han}/gu) ?? []),
        ]
      : tokenize,
    processTerm: (term: string) => term.normalize("NFKC").toLowerCase(),
  }
}

export function indexSearchPages(
  pages: SearchPage[],
  locale: string
): SearchArtifact {
  const full = new MiniSearch(searchIndexOptions(locale))
  const titles = new MiniSearch(searchIndexOptions(locale, true))
  const documents = pages.map((page) => ({
    id: page.id,
    title: page.title,
    headings: page.sections.map((section) => section.heading ?? "").join("\n"),
    text: page.sections.map((section) => section.text).join("\n"),
    code: page.sections.map((section) => section.code).join("\n"),
  }))
  full.addAll(documents)
  titles.addAll(documents)
  return {
    version: SEARCH_VERSION,
    locale,
    pages,
    full: full.toJSON(),
    titles: titles.toJSON(),
  }
}

export async function collectSearchPages(
  cwd: string,
  locale: string
): Promise<SearchPage[]> {
  const config = await loadCodeAtlasConfig(cwd)
  const entries = flattenDocs(
    config.docs?.categories ?? [],
    locale === "default" ? undefined : locale
  )
  const pages: SearchPage[] = []
  // Sequential reads keep peak source/AST memory bounded for large sites.
  for (const [order, entry] of entries.entries()) {
    if (entry.draft || entry.disabled) continue
    const requestedLocale = config.docs?.i18n ? locale : undefined
    const doc = await readDocEntry(entry, cwd, config, requestedLocale)
    if (doc.contentLocale !== requestedLocale) continue
    const extracted = extractSearchDocument(doc)
    pages.push({
      id: entry.slug,
      url: localizedDocHref(entry.slug, requestedLocale, config.docs?.i18n),
      order,
      ...extracted,
    })
  }
  return pages
}

export interface BuildDocsSearchOptions {
  cwd?: string
  outDir?: string
}

export async function buildDocsSearchIndex({
  cwd = process.cwd(),
  outDir = resolve(cwd, SEARCH_DIRECTORY),
}: BuildDocsSearchOptions = {}) {
  const config = await loadCodeAtlasConfig(cwd)
  const locales = config.docs?.i18n
    ? Object.keys(config.docs.i18n.locales)
    : ["default"]
  await mkdir(outDir, { recursive: true })
  const stats = []
  for (const locale of locales) {
    const artifact = indexSearchPages(
      await collectSearchPages(cwd, locale),
      locale
    )
    const json = JSON.stringify(artifact)
    const destination = resolve(outDir, `${locale}.json`)
    const temporary = `${destination}.${process.pid}.tmp`
    await writeFile(temporary, json)
    await rename(temporary, destination)
    stats.push({
      locale,
      pages: artifact.pages.length,
      bytes: Buffer.byteLength(json),
    })
  }
  return stats
}

export async function readSearchArtifact(cwd: string, locale: string) {
  const artifact = JSON.parse(
    await readFile(resolve(cwd, SEARCH_DIRECTORY, `${locale}.json`), "utf8")
  ) as SearchArtifact
  if (
    artifact.version !== SEARCH_VERSION ||
    artifact.locale !== locale ||
    !Array.isArray(artifact.pages)
  ) {
    throw new Error(
      "Search index format is incompatible. Rebuild the search indexes."
    )
  }
  return artifact
}
