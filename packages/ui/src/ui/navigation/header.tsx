"use client"

import { HeaderGithub } from "../../components/header-github"
import { HeaderNav } from "../../components/header-nav"
import { ThemeToggle } from "../../components/theme-toggle"
import { useConfig } from "../../lib/config-provider"
import { LanguageSelect } from "../../components/language-select"

function Header() {
  const { logo, logoHref, title, header, dark } = useConfig()

  return (
    <div className="absolute inset-x-0 top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-xs">
      <div className="flex items-center gap-4">
        <a href={logoHref ?? "/"} className="flex items-center gap-2">
          <img src={logo} alt="" className="size-8 dark:hidden" />
          <img
            src={dark?.logo || logo}
            alt=""
            className="hidden size-8 dark:block"
          />
          <span className="text-lg font-medium">{title}</span>
        </a>
        {header?.nav && (
          <>
            <div className="h-4 w-px bg-border/55" />
            <HeaderNav nav={header.nav} />
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <LanguageSelect />
        <ThemeToggle />
        {header?.github && <HeaderGithub github={header.github} />}
      </div>
    </div>
  )
}

export { Header }
