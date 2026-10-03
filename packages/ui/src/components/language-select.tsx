"use client"

import { Select } from "@base-ui/react/select"
import { Languages, ChevronDown, Check } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useDocsLocale } from "../lib/use-docs-locale"
import { localizedDocHref } from "../lib/docs-i18n"

export function LanguageSelect() {
  const { locale, slug, i18n, messages } = useDocsLocale()
  const pathname = usePathname()
  const router = useRouter()
  if (!i18n || Object.keys(i18n.locales).length < 2) return null
  const items = Object.entries(i18n.locales).map(([value, language]) => ({
    value,
    label: language.label,
  }))

  return (
    <Select.Root
      items={items}
      value={locale}
      modal={false}
      onValueChange={(value) => {
        if (!value || value === locale) return
        const inDocs = pathname === "/docs" || pathname?.startsWith("/docs/")
        router.push(
          localizedDocHref(inDocs ? slug : "/", value, i18n) +
            window.location.search +
            window.location.hash
        )
      }}
    >
      <Select.Trigger
        aria-label={messages.language}
        className="group flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:bg-accent"
      >
        <Languages
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        <Select.Value />
        <Select.Icon>
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 text-muted-foreground transition-transform group-data-[popup-open]:rotate-180 motion-reduce:transition-none"
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          alignItemWithTrigger={false}
          className="z-50"
        >
          <Select.Popup className="min-w-44 origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <Select.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  label={item.label}
                  lang={item.value}
                  className="flex cursor-pointer items-center justify-between gap-6 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
