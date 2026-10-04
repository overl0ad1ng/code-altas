"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { ListTree, X } from "lucide-react"
import { useConfig } from "../lib/config-provider"
import { useDocsLocale } from "../lib/use-docs-locale"
import { flattenDocs } from "../lib/docs-content"
import {
  docHref,
  getDocsCategorySlug,
  normalizeDocsPath,
} from "../lib/docs-navigation"
import { MobileDocsNavigationContext } from "../lib/mobile-docs-navigation"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerTitle,
} from "../primitives/drawer"
import { ScrollArea } from "../primitives/scroll-area"
import { Header } from "../ui/navigation/header"

export function DocsNavigationShell({
  desktopNavigation,
  mobileNavigation,
  children,
  footer,
}: {
  desktopNavigation: ReactNode
  mobileNavigation: ReactNode
  children: ReactNode
  footer: ReactNode
}) {
  const { docs } = useConfig()
  const { locale, i18n, messages } = useDocsLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const previousPath = useRef(pathname)
  const categoryDestination = useRef<string | null>(null)
  const pendingSearch = useRef<(() => void) | null>(null)
  const index = flattenDocs(docs?.categories ?? [], locale)
  const categories = (docs?.categories ?? []).map((category) => {
    const slug = category.slug.split("/").filter(Boolean).join("/")
    return {
      ...category,
      slug,
      hrefs: index
        .filter((entry) => entry.categorySlug === slug)
        .map((entry) => docHref(entry.slug, locale, i18n)),
    }
  })
  const active = getDocsCategorySlug(pathname, categories)
  const category = categories.find((item) => item.slug === active)
  const categoryName = (locale && category?.i18n?.[locale]) || category?.name

  useEffect(() => {
    if (pathname === previousPath.current) return
    previousPath.current = pathname
    if (normalizeDocsPath(pathname ?? "") !== categoryDestination.current)
      setOpen(false)
    categoryDestination.current = null
    pendingSearch.current = null
  }, [pathname])

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)")
    function closeOnDesktop() {
      if (desktop.matches) {
        pendingSearch.current = null
        setOpen(false)
      }
    }
    desktop.addEventListener("change", closeOnDesktop)
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [])

  return (
    <div className="relative h-dvh overflow-hidden [--docs-nav-width:16rem]">
      <Header
        onSearchRequest={(openSearch) => {
          if (open) {
            pendingSearch.current = openSearch
            setOpen(false)
          } else openSearch()
        }}
      />
      <aside
        aria-label="Documentation Navigation"
        className="fixed inset-y-0 left-0 z-10 hidden w-[var(--docs-nav-width)] pt-14 md:block"
      >
        <div className="h-full p-2">{desktopNavigation}</div>
      </aside>
      <Drawer
        open={open}
        swipeDirection="left"
        onOpenChange={setOpen}
        onOpenChangeComplete={(isOpen) => {
          if (!isOpen && pendingSearch.current) {
            const openSearch = pendingSearch.current
            pendingSearch.current = null
            openSearch()
          }
        }}
      >
        <div className="absolute inset-x-0 top-14 z-20 flex h-11 items-center justify-between gap-3 border-b border-border bg-background px-4 md:hidden">
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {categoryName ?? messages.categorySelect}
          </span>
          <DrawerTrigger
            ref={trigger}
            aria-label={messages.docsNavigation}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ListTree aria-hidden="true" className="size-4" />
            {messages.docsNavigation}
          </DrawerTrigger>
        </div>
        <DrawerContent
          className="border-0 bg-background text-foreground shadow-none motion-reduce:transition-none [&_[data-slot=drawer-content]]:motion-reduce:transition-none"
          finalFocus={() =>
            pendingSearch.current ||
            window.matchMedia("(min-width: 768px)").matches
              ? false
              : trigger.current
          }
        >
          <div className="flex min-h-0 flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
            <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
              <DrawerTitle className="text-base font-semibold">
                {messages.docsNavigation}
              </DrawerTitle>
              <DrawerClose
                aria-label={messages.docsNavigationClose}
                className="flex size-11 cursor-pointer items-center justify-center rounded-lg hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X aria-hidden="true" className="size-5" />
              </DrawerClose>
            </div>
            <MobileDocsNavigationContext.Provider
              value={{
                onArticleSelect: () => {
                  categoryDestination.current = null
                  setOpen(false)
                },
                onCategoryNavigate: (href) => {
                  categoryDestination.current = normalizeDocsPath(href)
                },
              }}
            >
              <div className="min-h-0 flex-1">{mobileNavigation}</div>
            </MobileDocsNavigationContext.Provider>
          </div>
        </DrawerContent>
      </Drawer>
      <div className="absolute inset-y-0 right-0 left-0 min-w-0 md:left-[var(--docs-nav-width)]">
        <ScrollArea className="h-full">
          <div className="flex min-h-full min-w-0 flex-col pt-25 md:pt-14">
            <main className="min-w-0 flex-1 [&_[data-doc-body]_:is(h1,h2,h3,h4,h5,h6)]:scroll-mt-28 md:[&_[data-doc-body]_:is(h1,h2,h3,h4,h5,h6)]:scroll-mt-20">
              <div className="w-full py-8">{children}</div>
            </main>
            <div className="shrink-0">{footer}</div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
