"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { usePathname } from "next/navigation"
import { parseDocsRoute } from "./docs-i18n"

import type { Config } from "../interface/Config"

const ConfigContext = createContext<Config | null>(null)

export function ConfigProvider({
  config,
  children,
}: {
  config: Config
  children: ReactNode
}) {
  const pathname = usePathname()
  useEffect(() => {
    if (!config.docs?.i18n) return
    const path = pathname ?? "/"
    const inDocs = path === "/docs" || path.startsWith("/docs/")
    document.documentElement.lang = inDocs
      ? parseDocsRoute(path.slice(5), config.docs.i18n).locale!
      : config.docs.i18n.defaultLocale
  }, [pathname, config.docs?.i18n])
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
    </ThemeProvider>
  )
}

/** Read the app configuration inside a client component. */
export function useConfig(): Config {
  const config = useContext(ConfigContext)

  if (!config) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }

  return config
}
