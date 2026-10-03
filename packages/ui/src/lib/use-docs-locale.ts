"use client"

import { usePathname } from "next/navigation"
import { useConfig } from "./config-provider"
import { docsMessages, parseDocsRoute } from "./docs-i18n"

export function useDocsLocale() {
  const { docs } = useConfig()
  const pathname = usePathname() ?? "/"
  const route = parseDocsRoute(
    pathname.replace(/^\/docs(?=\/|$)/, ""),
    docs?.i18n
  )
  return {
    ...route,
    i18n: docs?.i18n,
    messages: docsMessages(route.locale, docs?.i18n),
  }
}
