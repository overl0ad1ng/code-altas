import { performance } from "node:perf_hooks"
import process from "node:process"
import { Buffer } from "node:buffer"
import { gzipSync } from "node:zlib"
import { cpus } from "node:os"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url)
const { indexSearchPages, collectSearchPages } = await jiti.import(
  "../src/server/search-index.ts"
)
const { extractSearchDocument } = await jiti.import(
  "../src/server/search-extract.ts"
)
const { loadSearchDatabase, querySearchDatabase } = await jiti.import(
  "../src/server/docs-search.ts"
)
console.log(
  JSON.stringify({
    node: process.version,
    platform: process.platform,
    cpu: cpus()[0]?.model,
  })
)

function measure(pages, locale, extractionMs = 0) {
  const { json, buildMs } = (() => {
    const start = performance.now()
    const artifact = indexSearchPages(pages, locale)
    const buildMs = performance.now() - start
    return { json: JSON.stringify(artifact), buildMs }
  })()
  const bytes = Buffer.byteLength(json)
  const gzipBytes = gzipSync(json).length
  globalThis.gc?.()
  const before = process.memoryUsage().heapUsed
  const loadStart = performance.now()
  const database = loadSearchDatabase(JSON.parse(json))
  const loadMs = performance.now() - loadStart
  globalThis.gc?.()
  const heapMB = (process.memoryUsage().heapUsed - before) / 1024 / 1024
  const queries =
    locale === "en"
      ? [
          "a",
          "common",
          "configuration",
          "permissions access",
          "API_KEY",
          "missingword",
        ]
      : ["配", "配置", "文档", "权限 访问", "API_KEY", "不存在的词"]
  const timings = []
  const shortTimings = []
  for (let round = 0; round < 15; round++) {
    for (const query of queries) {
      const started = performance.now()
      querySearchDatabase(database, query)
      const duration = performance.now() - started
      if (round >= 3) {
        timings.push(duration)
        if (query === queries[0]) shortTimings.push(duration)
      }
    }
  }
  const p95 = (values) =>
    values.sort((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1]
  return {
    locale,
    pages: pages.length,
    bytes,
    gzipBytes,
    extractionMs: Math.round(extractionMs),
    buildMs: Math.round(buildMs),
    loadMs: Math.round(loadMs),
    heapDeltaMB: +heapMB.toFixed(1),
    queryP95Ms: +p95(timings).toFixed(2),
    shortQueryP95Ms: +p95(shortTimings).toFixed(2),
  }
}

const rows = []
const app = new URL("../../../apps/web/", import.meta.url)
const { fileURLToPath } = await import("node:url")
for (const locale of ["en", "zh-CN"])
  rows.push(
    measure(await collectSearchPages(fileURLToPath(app), locale), locale)
  )
for (const count of [1000, 10000]) {
  for (const locale of ["en", "zh-CN"]) {
    const started = performance.now()
    const pages = Array.from({ length: count }, (_, index) => {
      const title =
        locale === "en" ? `API Configuration ${index}` : `接口配置文档 ${index}`
      const content =
        locale === "en"
          ? `## Access permissions\n\nCommon configuration guide ${index}. Permissions access and deployment settings.\n\n\`\`\`ts\nconst API_KEY = readDoc(${index})\n\`\`\``
          : `## 权限设置\n\n配置文档 ${index}。权限访问以及部署设置说明。\n\n\`\`\`ts\nconst API_KEY = readDoc(${index})\n\`\`\``
      return {
        id: String(index),
        url: `/docs/${index}`,
        order: index,
        ...extractSearchDocument({ title, content, extension: ".mdx" }),
      }
    })
    rows.push(measure(pages, locale, performance.now() - started))
  }
}
console.table(rows)
console.log(
  "Heap deltas measure the loaded database after GC (excluding build allocations); query measurements include ranking and snippets, not HTTP/network latency."
)
