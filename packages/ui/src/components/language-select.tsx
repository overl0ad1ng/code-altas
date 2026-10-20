"use client"

import { Languages } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useDocsLocale } from "../lib/use-docs-locale"
import { localizedDocHref } from "../lib/docs-i18n"
import { SelectControl } from "./select-control"

export function LanguageSelect({ className }: { className?: string } = {}) {
  const { locale, slug, i18n, messages } = useDocsLocale()
  const pathname = usePathname()
  const router = useRouter()
  if (!i18n || Object.keys(i18n.locales).length < 2) return null
  const items = Object.entries(i18n.locales).map(([value, language]) => ({
    value,
    label: language.label,
    lang: value,
  }))
  return (
    <SelectControl
      items={items}
      value={locale ?? i18n.defaultLocale}
      label={messages.language}
      className={className}
      icon={
        <Languages
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      }
      onValueChange={(value) => {
        const inDocs = pathname === "/docs" || pathname?.startsWith("/docs/")
        router.push(
          localizedDocHref(inDocs ? slug : "/", value, i18n) +
            window.location.search +
            window.location.hash
        )
      }}
    />
  )
}
