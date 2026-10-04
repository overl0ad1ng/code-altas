import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const { getProjectOverview } = await createJiti(import.meta.url).import(
  "../lib/project-overview.ts"
)

const release = (tag, day, extra = {}) => ({
  tag_name: tag,
  name: "",
  published_at: `2026-10-${day}T00:00:00Z`,
  html_url: `https://github.com/owner/repo/releases/tag/${tag}`,
  ...extra,
})

function mockApi(t, overrides = {}) {
  const calls = []
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options })
    const key = url.includes("/releases?")
      ? "releases"
      : url.includes("api.github.com")
        ? "github"
        : url.includes("registry.npmjs.org")
          ? "tags"
          : url.includes("last-week")
            ? "weekly"
            : "monthly"
    const fixtures = {
      github: { full_name: "owner/repo", stargazers_count: 42, forks_count: 0 },
      releases: [
        release("v1", "01"),
        release("v2", "02", { prerelease: true }),
        release("v3", "03"),
      ],
      tags: {
        "dist-tags": { next: "2.0.0", beta: "1.1.0", latest: "1.0.0" },
        time: { "1.0.0": "2026-10-01T00:00:00Z", "1.1.0": "invalid" },
      },
      weekly: { downloads: 0 },
      monthly: { downloads: 1200 },
      ...overrides,
    }
    const value = fixtures[key]
    if (value instanceof Error) throw value
    return value instanceof Response ? value : Response.json(value)
  })
  return calls
}

test("maps channels, dates, zero counts, releases and server cache options", async (t) => {
  const calls = mockApi(t)
  const data = await getProjectOverview("owner/repo", "@code-altas/ui")
  assert.deepEqual(data.github, { stars: 42, forks: 0 })
  assert.equal(data.weeklyDownloads, 0)
  assert.equal(data.monthlyDownloads, 1200)
  assert.deepEqual(
    data.tags.map((tag) => tag.name),
    ["latest", "beta", "next"]
  )
  assert.equal(data.tags[0].publishedAt, "2026-10-01T00:00:00Z")
  assert.equal(data.tags[1].publishedAt, null)
  assert.equal(data.tags[2].publishedAt, null)
  assert.deepEqual(
    data.releases.map((item) => item.tag),
    ["v3", "v2", "v1"]
  )
  assert.equal(data.releases[1].prerelease, true)
  assert.equal(data.releases[0].name, "v3")
  assert.equal(calls.length, 5)
  for (const { options } of calls) {
    assert.equal(options.cache, "force-cache")
    assert.equal(options.next.revalidate, 3600)
    assert.ok(options.signal instanceof AbortSignal)
  }
  assert.ok(calls.some(({ url }) => url.includes("%40code-altas%2Fui")))
})

test("limit, filter draft releases and preserve empty lists", async (t) => {
  mockApi(t, {
    releases: [
      release("draft", "04", { draft: true }),
      ...["01", "02", "03", "04"].map((day) => release(`v${day}`, day)),
    ],
    tags: { "dist-tags": {} },
  })
  const data = await getProjectOverview("owner/repo", "pkg")
  assert.deepEqual(
    data.releases.map((item) => item.tag),
    ["v04", "v03", "v02"]
  )
  assert.deepEqual(data.tags, [])
})

test("rate limits, timeout and invalid payloads fail independently", async (t) => {
  mockApi(t, {
    github: new Response("limited", { status: 403 }),
    releases: [],
    weekly: new DOMException("Timed out", "TimeoutError"),
    monthly: { downloads: -1 },
  })
  const data = await getProjectOverview("owner/repo", "pkg")
  assert.equal(data.github, null)
  assert.deepEqual(data.releases, [])
  assert.equal(data.weeklyDownloads, null)
  assert.equal(data.monthlyDownloads, null)
  assert.equal(data.tags.length, 3)
})

test("missing package and malformed release do not hide repository metrics", async (t) => {
  mockApi(t, {
    tags: new Response("missing", { status: 404 }),
    releases: [{ tag_name: "v1", html_url: "javascript:alert(1)" }],
  })
  const data = await getProjectOverview("owner/repo", "pkg")
  assert.equal(data.tags, null)
  assert.equal(data.releases, null)
  assert.equal(data.github.stars, 42)
})
