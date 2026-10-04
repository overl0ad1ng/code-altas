"use client"

import { usePathname } from "next/navigation"
import { useRef, useState } from "react"
import { cn } from "cn"

import type { ConfigHeaderNav } from "../interface/Config"
import { SharedIndicator } from "./shared-indicator"
import { useDocsLocale } from "../lib/use-docs-locale"
import { localizedDocHref } from "../lib/docs-i18n"

function routePath(href: string) {
  return href.split(/[?#]/)[0]?.replace(/\/+$/, "") || "/"
}

function HeaderNav({
  nav,
  mobile = false,
  onNavigate,
}: {
  nav: ConfigHeaderNav
  mobile?: boolean
  onNavigate?: () => void
}) {
  const { locale, i18n } = useDocsLocale()
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
      className={cn(
        "relative isolate flex",
        mobile ? "flex-col gap-2" : "items-center gap-4"
      )}
      onPointerLeave={() => setHoveredPath(null)}
      onPointerCancel={() => setHoveredPath(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedPath(null)
        }
      }}
    >
      {!mobile && (
        <SharedIndicator
          containerRef={containerRef}
          target={targetPath}
          className="border border-border bg-background"
        />
      )}
      {entries.map(([path, item]) => (
        <a
          key={path}
          data-nav-path={path}
          data-indicator-value={path}
          href={
            item.disabled
              ? undefined
              : path === "/docs"
                ? localizedDocHref("/", locale, i18n)
                : path
          }
          aria-current={path === activePath ? "page" : undefined}
          aria-disabled={item.disabled || undefined}
          tabIndex={item.disabled ? -1 : undefined}
          className={cn(
            "relative z-10 rounded-lg text-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
            mobile
              ? "flex min-h-11 w-full items-center px-3 py-2.5 hover:bg-accent/50 aria-[current=page]:bg-accent"
              : "px-2 py-1 whitespace-nowrap"
          )}
          onClick={item.disabled ? undefined : onNavigate}
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
