export interface ProjectRelease {
  name: string
  tag: string
  publishedAt: string | null
  prerelease: boolean
  url: string
}

export interface PackageTag {
  name: string
  version: string
  publishedAt: string | null
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid project metadata")
  return value as Record<string, unknown>
}

function count(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null
}

function date(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : null
}

async function request<T>(
  url: string,
  parse: (value: unknown) => T,
  headers?: HeadersInit
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers,
      cache: "force-cache",
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error(`Project API returned ${response.status}`)
    return parse(await response.json())
  } catch {
    return null
  }
}

/** Server-side only: the optional GitHub credential never reaches the component props. */
export async function getProjectOverview(
  repository: string,
  packageName: string
) {
  const repoPath = repository.split("/").map(encodeURIComponent).join("/")
  const packagePath = encodeURIComponent(packageName)
  const githubHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (process.env.GITHUB_TOKEN)
    githubHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const [github, releases, tags, weeklyDownloads, monthlyDownloads] =
    await Promise.all([
      request(
        `https://api.github.com/repos/${repoPath}`,
        (value) => {
          const data = record(value)
          if (typeof data.full_name !== "string")
            throw new Error("Invalid repository")
          return {
            stars: count(data.stargazers_count),
            forks: count(data.forks_count),
          }
        },
        githubHeaders
      ),
      request(
        `https://api.github.com/repos/${repoPath}/releases?per_page=3`,
        (value): ProjectRelease[] => {
          if (!Array.isArray(value)) throw new Error("Invalid releases")
          return value
            .map((item) => {
              const release = record(item)
              if (
                typeof release.tag_name !== "string" ||
                typeof release.html_url !== "string"
              )
                throw new Error("Invalid release")
              const url = new URL(release.html_url)
              if (url.protocol !== "https:" || url.hostname !== "github.com")
                throw new Error("Invalid release URL")
              return {
                name:
                  typeof release.name === "string" && release.name.trim()
                    ? release.name
                    : release.tag_name,
                tag: release.tag_name,
                publishedAt: date(release.published_at),
                prerelease: release.prerelease === true,
                url: url.href,
                draft: release.draft === true,
              }
            })
            .filter((release) => !release.draft)
            .sort(
              (a, b) =>
                Date.parse(b.publishedAt ?? "") -
                Date.parse(a.publishedAt ?? "")
            )
            .slice(0, 3)
        },
        githubHeaders
      ),
      request(
        `https://registry.npmjs.org/${packagePath}`,
        (value): PackageTag[] => {
          const data = record(value)
          const distTags = record(data["dist-tags"])
          const times = data.time ? record(data.time) : {}
          return Object.entries(distTags)
            .map(([name, version]) => {
              if (typeof version !== "string" || !version)
                throw new Error("Invalid tag")
              return { name, version, publishedAt: date(times[version]) }
            })
            .sort((a, b) =>
              a.name === b.name
                ? 0
                : a.name === "latest"
                  ? -1
                  : b.name === "latest"
                    ? 1
                    : a.name.localeCompare(b.name)
            )
        }
      ),
      ...["last-week", "last-month"].map((period) =>
        request(
          `https://api.npmjs.org/downloads/point/${period}/${packagePath}`,
          (value) => {
            const data = record(value)
            const downloads = count(data.downloads)
            if (downloads === null) throw new Error("Invalid downloads")
            return downloads
          }
        )
      ),
    ])

  return { github, releases, tags, weeklyDownloads, monthlyDownloads }
}
