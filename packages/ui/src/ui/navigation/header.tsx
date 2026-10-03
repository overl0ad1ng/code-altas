"use client"

import { HeaderGithub } from "../../components/header-github"
import { HeaderNav } from "../../components/header-nav"
import { ThemeToggle } from "../../components/theme-toggle"
import { useConfig } from "../../lib/config-provider"
import { LanguageSelect } from "../../components/language-select"
import { DocsSearch } from "../../components/docs-search"

function Header() {
  const { logo, logoHref, title, header, dark } = useConfig()

  return (
    <div className="absolute inset-x-0 top-0 z-20 flex h-14 w-full items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xs sm:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <a href={logoHref ?? "/"} className="flex items-center gap-2">
          <img src={logo} alt="" className="size-8 dark:hidden" />
          <img
            src={dark?.logo || logo}
            alt=""
            className="hidden size-8 dark:block"
          />
          <span className="hidden text-lg font-medium sm:inline">{title}</span>
        </a>
        {header?.nav && (
          <div className="hidden items-center gap-4 md:flex">
            <div className="h-4 w-px bg-border/55" />
            <HeaderNav nav={header.nav} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <DocsSearch />
        <div className="h-4 w-px bg-border/55" />
        <LanguageSelect />
        <ThemeToggle />
        {header?.github && <HeaderGithub github={header.github} />}
      </div>
    </div>
  )
}

export { Header }
