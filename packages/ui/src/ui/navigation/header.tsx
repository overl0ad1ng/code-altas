"use client"

import { Menu, Search, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { HeaderGithub } from "../../components/header-github"
import { HeaderNav } from "../../components/header-nav"
import { ThemeToggle } from "../../components/theme-toggle"
import { useConfig } from "../../lib/config-provider"
import { useDocsLocale } from "../../lib/use-docs-locale"
import { LanguageSelect } from "../../components/language-select"
import { DocsSearch } from "../../components/docs-search"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
} from "../../primitives/drawer"

const iconButton =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

interface HeaderProps {
  onSearchRequest?: (openSearch: () => void) => void
}

function HeaderContent({ onSearchRequest }: HeaderProps) {
  const { logo, logoHref, title, header, dark, docs } = useConfig()
  const { messages } = useDocsLocale()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [pendingSearch, setPendingSearch] = useState(false)
  const menuTrigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)")
    function closeOnDesktop() {
      if (desktop.matches) {
        setDrawerOpen(false)
        setPendingSearch(false)
      }
    }
    desktop.addEventListener("change", closeOnDesktop)
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [])

  function changeSearch(open: boolean) {
    if (open && drawerOpen) {
      setPendingSearch(true)
      setDrawerOpen(false)
    } else {
      if (open && onSearchRequest) onSearchRequest(() => setSearchOpen(true))
      else setSearchOpen(open)
    }
  }

  const brand = (
    <>
      <img src={logo} alt="" className="size-8 dark:hidden" />
      <img
        src={dark?.logo || logo}
        alt=""
        className="hidden size-8 dark:block"
      />
    </>
  )

  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-14 w-full items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xs sm:px-8">
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        <a
          href={logoHref ?? "/"}
          aria-label={title}
          className="flex min-h-11 items-center gap-2"
        >
          {brand}
          <span className="hidden text-lg font-medium md:inline">{title}</span>
        </a>
        <Drawer
          open={drawerOpen}
          swipeDirection="left"
          onOpenChange={(open) => {
            setDrawerOpen(open)
            if (open) setPendingSearch(false)
          }}
          onOpenChangeComplete={(open) => {
            if (!open && pendingSearch) {
              setPendingSearch(false)
              setSearchOpen(true)
            }
          }}
        >
          <DrawerTrigger
            ref={menuTrigger}
            aria-label={messages.menuOpen}
            className={`${iconButton} md:hidden`}
          >
            <Menu className="size-5" aria-hidden="true" />
          </DrawerTrigger>
          <DrawerContent
            className="border-0 bg-background/95 text-foreground shadow-none motion-reduce:transition-none [&_[data-slot=drawer-content]]:motion-reduce:transition-none"
            finalFocus={() =>
              pendingSearch ||
              searchOpen ||
              window.matchMedia("(min-width: 768px)").matches
                ? false
                : menuTrigger.current
            }
          >
            <DrawerTitle className="sr-only">{messages.menuOpen}</DrawerTitle>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
              <div className="mb-6 flex shrink-0 items-center justify-between gap-4">
                <a
                  href={logoHref ?? "/"}
                  aria-label={title}
                  className="flex min-h-11 items-center gap-2"
                  onClick={() => setDrawerOpen(false)}
                >
                  {brand}
                  <span className="text-lg font-medium">{title}</span>
                </a>
                <DrawerClose
                  aria-label={messages.menuClose}
                  className={iconButton}
                >
                  <X className="size-5" aria-hidden="true" />
                </DrawerClose>
              </div>
              <div className="flex flex-1 flex-col justify-between gap-8">
                <div className="space-y-6">
                  {docs?.search && (
                    <button
                      type="button"
                      aria-label={messages.search}
                      onClick={() => changeSearch(true)}
                      className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <Search className="size-4 shrink-0" aria-hidden="true" />
                      {messages.searchPlaceholder}
                    </button>
                  )}
                  {header?.nav && (
                    <HeaderNav
                      nav={header.nav}
                      mobile
                      onNavigate={() => setDrawerOpen(false)}
                    />
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  {header?.github && (
                    <HeaderGithub
                      github={header.github}
                      className="max-h-none min-h-11 px-3"
                    />
                  )}
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <ThemeToggle className="size-11" />
                    <LanguageSelect className="h-11" />
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        {header?.nav && (
          <div className="hidden items-center gap-4 md:flex">
            <div className="h-4 w-px bg-border/55" />
            <HeaderNav nav={header.nav} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <DocsSearch
          open={searchOpen}
          onOpenChange={changeSearch}
          triggerClassName="size-11 justify-center border-0 bg-transparent px-0 md:h-8 md:w-auto md:justify-start md:border md:bg-background md:px-2.5"
        />
        <div className="hidden items-center gap-4 md:flex">
          <div className="h-4 w-px bg-border/55" />
          <LanguageSelect />
          <ThemeToggle />
          {header?.github && <HeaderGithub github={header.github} />}
        </div>
      </div>
    </header>
  )
}

function Header(props: HeaderProps = {}) {
  // Route changes dismiss overlays, including locale changes within the docs layout.
  const pathname = usePathname()
  return <HeaderContent key={pathname} {...props} />
}

export { Header }
