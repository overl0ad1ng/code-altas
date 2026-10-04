"use client"

import { createContext, useContext } from "react"

export const MobileDocsNavigationContext = createContext<{
  onArticleSelect: () => void
  onCategoryNavigate: (href: string) => void
} | null>(null)

export function useMobileDocsNavigation() {
  return useContext(MobileDocsNavigationContext)
}
