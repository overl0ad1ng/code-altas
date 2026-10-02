"use client"

import { createContext, useContext, type ReactNode } from "react"
import { ThemeProvider } from "next-themes"

import type { Config } from "../interface/Config"

const ConfigContext = createContext<Config | null>(null)

export function ConfigProvider({
  config,
  children,
}: {
  config: Config
  children: ReactNode
}) {
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
