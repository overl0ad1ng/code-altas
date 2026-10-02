"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef, useState, type ReactNode } from "react"

import { getDocsCategorySlug } from "../lib/docs-navigation"
import WarmTooltip, { WarmTooltipGroup } from "../primitives/tooltip"
import { SharedIndicator } from "./shared-indicator"

interface DocsCategoryNavItem {
  slug: string
  name: string
  href: string
  hrefs: string[]
  icon: ReactNode
}

function DocsCategoryNav({ items }: { items: DocsCategoryNavItem[] }) {
  const pathname = usePathname()
  const activeSlug = getDocsCategorySlug(pathname, items)
  const containerRef = useRef<HTMLElement>(null)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null)
  const targetSlug = [hoveredSlug, focusedSlug, activeSlug].find(
    (slug) => slug !== null && items.some((item) => item.slug === slug)
  )

  return (
    <nav
      ref={containerRef}
      aria-label="Documentation categories"
      className="relative isolate rounded-xl border border-border p-1"
      onPointerLeave={() => setHoveredSlug(null)}
      onPointerCancel={() => setHoveredSlug(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocusedSlug(null)
      }}
    >
      <SharedIndicator
        containerRef={containerRef}
        target={targetSlug}
        data-slot="docs-category-indicator"
        className="bg-accent"
      />
      <WarmTooltipGroup>
        <ul className="flex items-center gap-1">
          {items.map((item) => (
            <li key={item.slug} className="min-w-0 flex-1">
              <WarmTooltip
                content={item.name}
                side="top"
                surfaceColor="#f5f5f5"
                inkColor="#18181b"
                size="md"
                radius={8}
                gap={8}
                arrow
                popDuration={160}
                popScale={0.94}
                popBlur={4}
                showFuse={false}
                className="w-full!"
              >
                <Link
                  href={item.href}
                  prefetch={false}
                  data-category-slug={item.slug}
                  data-indicator-value={item.slug}
                  data-active={item.slug === activeSlug}
                  aria-current={item.slug === activeSlug ? "true" : undefined}
                  aria-label={item.name}
                  className="relative z-10 flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[active=true]:text-foreground"
                  onPointerEnter={() => setHoveredSlug(item.slug)}
                  onFocus={() => setFocusedSlug(item.slug)}
                >
                  {item.icon}
                </Link>
              </WarmTooltip>
            </li>
          ))}
        </ul>
      </WarmTooltipGroup>
    </nav>
  )
}

export { DocsCategoryNav }
