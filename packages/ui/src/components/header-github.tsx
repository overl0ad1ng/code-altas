"use client"

import { SiGithub } from "@icons-pack/react-simple-icons"
import { useEffect, useState } from "react"

import type { ConfigHeaderGithub } from "../interface/Config"

interface HeaderGithubProps {
  github: string | ConfigHeaderGithub
}

function HeaderGithub({ github }: HeaderGithubProps) {
  const url = typeof github === "string" ? github : github.url
  const showStars = typeof github === "string" || github.showStars !== false

  const repository = getGithubRepository(url)
  const apiUrl = repository?.apiUrl

  const [stars, setStars] = useState<{ apiUrl: string; count: number } | null>(
    null
  )

  useEffect(() => {
    if (!showStars || !apiUrl) return
    const requestUrl = apiUrl

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    async function fetchStars() {
      try {
        const response = await fetch(requestUrl, {
          headers: { Accept: "application/vnd.github+json" },
          signal: controller.signal,
        })
        if (!response.ok) return

        const data: { stargazers_count?: unknown } = await response.json()
        const count = data.stargazers_count
        if (
          !controller.signal.aborted &&
          typeof count === "number" &&
          Number.isSafeInteger(count) &&
          count >= 0
        ) {
          setStars({ apiUrl: requestUrl, count })
        }
      } catch {
        // Cleanup, timeouts, and network failures must not break the repository link.
      } finally {
        clearTimeout(timeout)
      }
    }

    void fetchStars()

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [apiUrl, showStars])

  if (!repository) return null

  const count = showStars && stars && stars.apiUrl === apiUrl ? stars.count : null

  return (
    <a
      href={repository.url}
      aria-label={`GitHub: ${repository.name}${count !== null ? `, ${count.toLocaleString("en-US")} stars` : ""}`}
      target="_blank"
      className="active:scale-98 origin-b border border-border inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <SiGithub aria-hidden="true" className="size-4 text-neutral-700" />

      {count !== null && (
        <span
          className="inline-flex items-center gap-1 tabular-nums font-medium"
          aria-label={`${count.toLocaleString("en-US")} stars`}
          title={`${count.toLocaleString("en-US")} stars`}
        >
          {starFormatter.format(count)}
        </span>
      )}
    </a>
  )
}

const starFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
})

function getGithubRepository(value: string) {
  try {
    const url = new URL(value)
    if (
      url.hostname !== "github.com" ||
      (url.protocol !== "https:" && url.protocol !== "http:")
    ) {
      return null
    }

    const [owner, rawRepo] = url.pathname.split("/").filter(Boolean)
    const repo = rawRepo?.replace(/\.git$/, "")
    if (!owner || !repo) return null

    return {
      name: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}`,
      apiUrl: `https://api.github.com/repos/${owner}/${repo}`,
    }
  } catch {
    return null
  }
}

export { HeaderGithub, type HeaderGithubProps }
