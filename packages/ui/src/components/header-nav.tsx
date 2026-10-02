"use client"

import { usePathname } from "next/navigation"
import { useRef, useState } from "react"

import type { ConfigHeaderNav } from "../interface/Config"
import { SharedIndicator } from "./shared-indicator"

function routePath(href: string) {
  return href.split(/[?#]/)[0]?.replace(/\/+$/, "") || "/"
}

function HeaderNav({ nav }: { nav: ConfigHeaderNav }) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLElement>(null)

  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [focusedPath, setFocusedPath] = useState<string | null>(null)

  const entries = Object.entries(nav)
  const currentPath = routePath(pathname ?? "/")

  // Prefer the most specific match, so /docs/api wins over /docs.
  const activePath = entries
    .filter(([href, item]) => {
      if (item.disabled || !href.startsWith("/") || href.startsWith("//")) {
        return false
      }
      const path = routePath(href)
      return (
        currentPath === path ||
        (path !== "/" && currentPath.startsWith(`${path}/`))
      )
    })
    .sort(([a], [b]) => routePath(b).length - routePath(a).length)[0]?.[0]

  const targetPath = [hoveredPath, focusedPath, activePath].find(
    (path) => path && nav[path] && !nav[path].disabled
  )

  return (
    <nav
      ref={containerRef}
      aria-label="Header Navigation"
      className="relative isolate flex items-center gap-4"
      onPointerLeave={() => setHoveredPath(null)}
      onPointerCancel={() => setHoveredPath(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedPath(null)
        }
      }}
    >
      <SharedIndicator
        containerRef={containerRef}
        target={targetPath}
        className="border border-border bg-background"
      />
      {entries.map(([path, item]) => (
        <a
          key={path}
          data-nav-path={path}
          data-indicator-value={path}
          href={item.disabled ? undefined : path}
          aria-current={path === activePath ? "page" : undefined}
          aria-disabled={item.disabled || undefined}
          tabIndex={item.disabled ? -1 : undefined}
          className="relative z-10 rounded-lg px-2 py-1 text-sm whitespace-nowrap outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          onPointerEnter={() => setHoveredPath(item.disabled ? null : path)}
          onFocus={() => setFocusedPath(item.disabled ? null : path)}
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}

export { HeaderNav }
