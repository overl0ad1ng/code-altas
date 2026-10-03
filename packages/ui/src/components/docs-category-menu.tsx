"use client"

import { usePathname, useRouter } from "next/navigation"

import { getDocsCategorySlug, normalizeDocsPath } from "../lib/docs-navigation"
import BranchedMenu, {
  type BranchedMenuItem,
} from "../primitives/branched-menu"

interface DocsCategoryMenuProps {
  categories: { slug: string; hrefs: string[]; items: BranchedMenuItem[] }[]
}

function DocsCategoryMenu({ categories }: DocsCategoryMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const activeSlug = getDocsCategorySlug(pathname, categories)
  const category = categories.find((item) => item.slug === activeSlug)
  const active = normalizeDocsPath(pathname ?? "")

  return (
    <BranchedMenu
      key={category?.slug ?? "empty"}
      items={category?.items ?? []}
      active={active}
      onSelect={(href) => router.push(href)}
      color="var(--foreground)"
      accentColor="var(--foreground)"
      lineColor="var(--border)"
      className="w-full"
    />
  )
}

export { DocsCategoryMenu }
