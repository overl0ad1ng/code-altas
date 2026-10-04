"use client"

import { usePathname, useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import { Search, X } from "lucide-react"

import { getDocsCategorySlug, normalizeDocsPath } from "../lib/docs-navigation"
import { useDocsLocale } from "../lib/use-docs-locale"
import { useMobileDocsNavigation } from "../lib/mobile-docs-navigation"
import { cn } from "cn"
import { ScrollArea } from "../primitives/scroll-area"
import BranchedMenu, {
  type BranchedMenuItem,
} from "../primitives/branched-menu"

interface DocsCategoryMenuProps {
  mobile?: boolean
  categories: {
    slug: string
    hrefs: string[]
    items: BranchedMenuItem[]
  }[]
}

function filterTitles<T extends BranchedMenuItem>(
  items: T[],
  keyword: string
): T[] {
  return items.flatMap((item) => {
    if (item.children?.length) {
      const children = filterTitles(item.children, keyword)
      return children.length ? [{ ...item, children }] : []
    }
    return item.value && item.label.toLowerCase().includes(keyword)
      ? [item]
      : []
  })
}

function branchKeys(items: BranchedMenuItem[], parent = ""): string[] {
  return items.flatMap((item, index) => {
    const key = parent ? `${parent}.${index}` : String(index)
    return item.children?.length ? [key, ...branchKeys(item.children, key)] : []
  })
}

function DocsCategoryMenu({
  categories,
  mobile = false,
}: DocsCategoryMenuProps) {
  const pathname = usePathname()
  const { locale } = useDocsLocale()
  const activeSlug = getDocsCategorySlug(pathname, categories)
  const category = categories.find((item) => item.slug === activeSlug)

  return (
    <SearchableCategoryMenu
      key={`${locale}:${activeSlug}`}
      category={category}
      mobile={mobile}
    />
  )
}

function SearchableCategoryMenu({
  category,
  mobile,
}: {
  category: DocsCategoryMenuProps["categories"][number] | undefined
  mobile: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { messages } = useDocsLocale()
  const mobileNavigation = useMobileDocsNavigation()
  const [query, setQuery] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const keyword = query.trim().toLowerCase()
  const items = useMemo(
    () =>
      keyword
        ? filterTitles(category?.items ?? [], keyword)
        : (category?.items ?? []),
    [category, keyword]
  )
  const active = normalizeDocsPath(pathname ?? "")

  function clear() {
    setQuery("")
    input.current?.focus()
  }

  return (
    <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <div className="my-2 flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-2.5 focus-within:ring-2 focus-within:ring-ring/50">
        <Search
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={input}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Escape" &&
              !event.nativeEvent.isComposing &&
              query
            ) {
              event.stopPropagation()
              clear()
            }
          }}
          aria-label={messages.navSearchPlaceholder}
          placeholder={messages.navSearchPlaceholder}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
            mobile ? "h-11" : "h-9"
          )}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label={messages.navSearchClear}
            className={cn(
              "shrink-0 cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
              mobile && "flex size-11 items-center justify-center"
            )}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <ScrollArea className="min-h-0" key={keyword ? "results" : "directory"}>
        {keyword && !items.length ? (
          <p role="status" className="px-3 py-3 text-sm text-muted-foreground">
            {messages.searchNoResults}
          </p>
        ) : (
          <BranchedMenu
            key={keyword}
            items={items}
            defaultOpen={keyword ? branchKeys(items) : 0}
            active={active}
            rowHeight={mobile ? 44 : undefined}
            onSelect={(href) => {
              setQuery("")
              mobileNavigation?.onArticleSelect()
              router.push(href)
            }}
            color="var(--foreground)"
            accentColor="var(--foreground)"
            lineColor="var(--border)"
            className="w-full"
          />
        )}
      </ScrollArea>
    </div>
  )
}

export { DocsCategoryMenu }
