import { readdir, stat } from "node:fs/promises"
import { resolve } from "node:path"
import MiniSearch from "minisearch"
import type { Config } from "../interface/Config"
import type {
  DocsSearchResponse,
  DocsSearchResult,
  SearchHighlight,
} from "../lib/docs-search"
import { loadCodeAtlasConfig } from "./config"
import {
  collectSearchPages,
  indexSearchPages,
  readSearchArtifact,
  searchIndexOptions,
  searchTokenizer,
  type SearchArtifact,
} from "./search-index"

export function loadSearchDatabase(artifact: SearchArtifact) {
  const tokenize = searchTokenizer(artifact.locale)
  return {
    full: MiniSearch.loadJSON(
      JSON.stringify(artifact.full),
      searchIndexOptions(artifact.locale)
    ),
    titles: MiniSearch.loadJSON(
      JSON.stringify(artifact.titles),
      searchIndexOptions(artifact.locale, true)
    ),
    pages: new Map(artifact.pages.map((page) => [page.id, page])),
    locale: artifact.locale,
    titleTerms: [
      ...new Set(
        artifact.pages.flatMap((page) => [
          ...tokenize(page.title, "title"),
          ...page.sections.flatMap((section) =>
            tokenize(section.heading ?? "", "headings")
          ),
        ])
      ),
    ].sort(),
  }
}

type SearchDatabase = ReturnType<typeof loadSearchDatabase>
const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" })

/** Skip an expensive duplicate prefix search when no title term can expand. */
function hasTitleExpansion(terms: string[], prefix: string) {
  let low = 0
  let high = terms.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (terms[middle]! <= prefix) low = middle + 1
    else high = middle
  }
  return !!terms[low]?.startsWith(prefix)
}

/** Find ranges in original text even when normalization changes string length. */
function ranges(text: string, terms: string[]): SearchHighlight[] {
  let normalized = ""
  const offsets: { start: number; end: number }[] = []
  for (const { segment: character, index: cursor } of graphemes.segment(text)) {
    const value = character.normalize("NFKC").toLowerCase()
    normalized += value
    for (let index = 0; index < value.length; index++)
      offsets.push({ start: cursor, end: cursor + character.length })
  }
  const found: SearchHighlight[] = []
  for (const term of terms) {
    const value = term.normalize("NFKC").toLowerCase()
    if (!value) continue
    let index = normalized.indexOf(value)
    while (index !== -1) {
      found.push({
        start: offsets[index]!.start,
        end: offsets[index + value.length - 1]!.end,
      })
      index = normalized.indexOf(value, index + value.length)
    }
  }
  found.sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: SearchHighlight[] = []
  for (const item of found) {
    const last = merged.at(-1)
    if (last && item.start <= last.end) last.end = Math.max(last.end, item.end)
    else merged.push({ ...item })
  }
  return merged
}

function excerpt(text: string, terms: string[]) {
  const compact = text.replace(/\s+/gu, " ").trim()
  const matches = ranges(compact, terms)
  // Slice by Unicode code points; highlighter offsets remain UTF-16 indices.
  const characters = [...compact]
  const first = matches[0]?.start ?? 0
  const preceding = [...compact.slice(0, first)].length
  const start = Math.max(0, preceding - 40)
  const end = Math.min(characters.length, start + 156)
  const snippet = `${start ? "…" : ""}${characters.slice(start, end).join("")}${end < characters.length ? "…" : ""}`
  return { snippet, highlights: ranges(snippet, terms) }
}

export function querySearchDatabase(
  database: SearchDatabase,
  query: string
): DocsSearchResponse {
  const effectiveLength = (query.match(/[\p{L}\p{N}]/gu) ?? []).length
  if (!effectiveLength) return { results: [] }
  const short = effectiveLength === 1
  const tokens = searchTokenizer(database.locale)(query)
  const common = {
    combineWith: "AND" as const,
    fuzzy: false,
    boost: { title: 8, headings: 4, text: 2, code: 1 },
  }
  const expand =
    !!tokens.length && hasTitleExpansion(database.titleTerms, tokens.at(-1)!)
  const hits = short
    ? database.titles.search(query, {
        ...common,
        prefix: !/\p{Script=Han}/u.test(query),
      })
    : database.full.search({
        combineWith: "OR",
        queries: [
          {
            queries: [query],
            ...common,
            fields: ["title", "headings", "text", "code"],
            prefix: false,
          },
          ...(expand
            ? [
                {
                  queries: [query],
                  ...common,
                  fields: ["title", "headings"],
                  prefix: (_term: string, index: number, terms: string[]) =>
                    index === terms.length - 1,
                },
              ]
            : []),
        ],
      })
  hits.sort(
    (a, b) =>
      b.score - a.score ||
      database.pages.get(String(a.id))!.order -
        database.pages.get(String(b.id))!.order
  )
  const results: DocsSearchResult[] = hits.slice(0, 20).map((hit) => {
    const page = database.pages.get(String(hit.id))!
    const terms = [...new Set(hit.terms.length ? hit.terms : tokens)]
    const strength = (value: string, weight: number) => {
      const normalized = value.normalize("NFKC").toLowerCase()
      const covered = terms.filter((term) =>
        normalized.includes(term.normalize("NFKC").toLowerCase())
      ).length
      return covered ? covered * 1000 + weight : 0
    }
    const matchedFields = new Set(Object.values(hit.match).flat())
    let type: DocsSearchResult["type"] = "title"
    let bestText = page.title
    let bestSection: (typeof page.sections)[number] | undefined
    let bestScore = matchedFields.has("title") ? strength(page.title, 8) : 0
    for (const section of page.sections) {
      for (const [field, value, weight, kind] of [
        ["headings", section.heading ?? "", 4, "heading"],
        ["text", section.text, 2, "text"],
        ["code", section.code, 1, "code"],
      ] as const) {
        if ((short && field !== "headings") || !matchedFields.has(field))
          continue
        const score = strength(value, weight)
        if (score > bestScore) {
          bestScore = score
          bestText = value
          bestSection = section
          type = kind
        }
      }
    }
    return {
      id: page.id,
      title: page.title,
      url:
        page.url +
        (bestSection?.anchor
          ? `#${encodeURIComponent(bestSection.anchor)}`
          : ""),
      type,
      heading: bestSection?.heading,
      ...excerpt(bestText, terms),
    }
  })
  return { results }
}

/** Development-only metadata polling, including newly added/deleted sources. */
async function sourceFingerprint(cwd: string) {
  const records: string[] = []
  async function scan(directory: string) {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) await scan(path)
      else if (/\.(?:mdx?|[cm]?[jt]s)$/u.test(entry.name)) {
        const info = await stat(path)
        records.push(`${path}:${info.mtimeMs}:${info.size}`)
      }
    }
  }
  await scan(resolve(cwd, "content"))
  for (const entry of await readdir(cwd)) {
    if (!/^codealtas\.config\./u.test(entry)) continue
    const info = await stat(resolve(cwd, entry))
    records.push(`${entry}:${info.mtimeMs}:${info.size}`)
  }
  return records.sort().join("\n")
}

export interface DocsSearchHandlerOptions {
  cwd?: string
  /** Override only for tests/tools; normally inferred from NODE_ENV. */
  development?: boolean
}

export function createDocsSearchHandler({
  cwd = process.cwd(),
  development = process.env.NODE_ENV === "development",
}: DocsSearchHandlerOptions = {}) {
  let configPromise: Promise<Config> | undefined
  let fingerprint: string | undefined
  let nextCheck = 0
  let checking: Promise<void> | undefined
  const databases = new Map<string, Promise<SearchDatabase>>()
  async function refreshDevelopment() {
    if (!development) return
    if (checking) return checking
    if (Date.now() < nextCheck) return
    checking = (async () => {
      const current = await sourceFingerprint(cwd)
      if (current !== fingerprint) {
        configPromise = loadCodeAtlasConfig(cwd)
        databases.clear()
        fingerprint = current
      }
      nextCheck = Date.now() + 1000
    })()
    try {
      await checking
    } finally {
      checking = undefined
    }
  }
  return async function GET(request: Request): Promise<Response> {
    const respond = (body: unknown, status = 200) =>
      Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
    try {
      const url = new URL(request.url)
      const query = (url.searchParams.get("q") ?? "").trim()
      if ([...query].length > 100)
        return respond({ error: "Query must be at most 100 characters." }, 400)
      await refreshDevelopment()
      configPromise ??= loadCodeAtlasConfig(cwd)
      const config = await configPromise
      if (!config.docs?.search)
        return respond({ error: "Document search is disabled." }, 404)
      const i18n = config.docs.i18n
      const locale =
        url.searchParams.get("locale") ?? i18n?.defaultLocale ?? "default"
      if (i18n ? !Object.hasOwn(i18n.locales, locale) : locale !== "default")
        return respond({ error: "Unknown search locale." }, 400)
      if (!/[\p{L}\p{N}]/u.test(query)) return respond({ results: [] })
      let database = databases.get(locale)
      if (!database) {
        database = (
          development
            ? collectSearchPages(cwd, locale).then((pages) =>
                indexSearchPages(pages, locale)
              )
            : readSearchArtifact(cwd, locale)
        ).then(loadSearchDatabase)
        databases.set(locale, database)
        // A failed load must not poison the process cache permanently.
        database.catch(() => {
          if (databases.get(locale) === database) databases.delete(locale)
        })
      }
      return respond(querySearchDatabase(await database, query))
    } catch (error) {
      configPromise = undefined
      console.error(
        "[Code Atlas search] Search failed. Production indexes must be generated before next build.",
        error
      )
      return respond(
        {
          error:
            "Search is unavailable. Check the server logs and rebuild the search indexes.",
        },
        503
      )
    }
  }
}
