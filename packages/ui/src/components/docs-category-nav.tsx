"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Select } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"

import { getDocsCategorySlug } from "../lib/docs-navigation"
import WarmTooltip, { WarmTooltipGroup } from "../primitives/tooltip"
import { SharedIndicator } from "./shared-indicator"
import { useDocsLocale } from "../lib/use-docs-locale"
import { useMobileDocsNavigation } from "../lib/mobile-docs-navigation"

interface DocsCategoryNavItem {
  slug: string
  name: string
  href: string
  hrefs: string[]
  icon: ReactNode
}

function DocsCategoryNav({
  items,
  mobile = false,
}: {
  items: DocsCategoryNavItem[]
  mobile?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { messages } = useDocsLocale()
  const mobileNavigation = useMobileDocsNavigation()
  const activeSlug = getDocsCategorySlug(pathname, items)
  const containerRef = useRef<HTMLElement>(null)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null)
  const targetSlug = [hoveredSlug, focusedSlug, activeSlug].find(
    (slug) => slug !== null && items.some((item) => item.slug === slug)
  )

  if (mobile || items.length >= 5) {
    const current = items.find((item) => item.slug === activeSlug)
    return (
      <Select.Root
        items={items.map((item) => ({ value: item.slug, label: item.name }))}
        value={activeSlug}
        modal={false}
        onValueChange={(value) => {
          const item = items.find((item) => item.slug === value)
          if (!item || item.slug === activeSlug) return
          mobileNavigation?.onCategoryNavigate(item.href)
          router.push(item.href)
        }}
      >
        <Select.Trigger
          aria-label={messages.categorySelect}
          data-slot="docs-category-select"
          className="flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {current?.icon}
          <Select.Value
            className="min-w-0 flex-1 truncate text-left"
            placeholder={messages.categorySelect}
          />
          <Select.Icon>
            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            side="bottom"
            align="start"
            sideOffset={6}
            alignItemWithTrigger={false}
            className="z-50"
          >
            <Select.Popup className="w-[var(--anchor-width)] origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
              <Select.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
                {items.map((item) => (
                  <Select.Item
                    key={item.slug}
                    value={item.slug}
                    label={item.name}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-accent"
                  >
                    {item.icon}
                    <Select.ItemText className="min-w-0 flex-1 truncate">
                      {item.name}
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <Check aria-hidden="true" className="size-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    )
  }

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
