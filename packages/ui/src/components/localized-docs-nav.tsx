"use client"

import type { ReactNode } from "react"
import { useDocsLocale } from "../lib/use-docs-locale"

/** Server-rendered icons stay on the server; select the navigation for this URL. */
export function LocalizedDocsNav({
  variants,
}: {
  variants: Record<string, ReactNode>
}) {
  const { locale } = useDocsLocale()
  return variants[locale ?? "default"]
}
