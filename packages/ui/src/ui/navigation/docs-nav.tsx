import { ScrollArea } from "../../primitives/scroll-area"
import { ConfigIcon } from "../../components/config-icon"
import { DocsCategoryNav } from "../../components/docs-category-nav"
import { DocsCategoryMenu } from "../../components/docs-category-menu"
import type {
  ConfigDocsCategories,
  ConfigDocsI18N,
  ConfigDocsCategoryDocs,
} from "../../interface/Config"
import { docHref } from "../../lib/docs-navigation"
import { flattenDocs, type DocEntry } from "../../lib/docs-content"
import type {
  BranchedMenuChild,
  BranchedMenuItem,
} from "../../primitives/branched-menu"
import { Logo } from "./logo"

function collectDocuments(
  docs: ConfigDocsCategoryDocs,
  base: string,
  entries: Map<string, DocEntry>,
  locale?: string,
  i18n?: ConfigDocsI18N
): BranchedMenuChild[] {
  return docs.flatMap((doc) => {
    if (doc.draft || doc.disabled) return []
    const path = [base, doc.slug?.split("/").filter(Boolean).join("/")]
      .filter(Boolean)
      .join("/")
    if (doc.docs?.length) {
      const children = collectDocuments(doc.docs, path, entries, locale, i18n)
      return children.length
        ? [
            {
              label: (locale && doc.i18n?.[locale]) || doc.name,
              value: path,
              children,
              icon: doc.icon && (
                <ConfigIcon name={doc.icon} className="size-4" />
              ),
            },
          ]
        : []
    }
    if (!doc.slug) return []
    const entry = entries.get(path)
    if (!entry || entry.draft || entry.disabled) return []
    return [
      {
        label: (locale && doc.i18n?.[locale]) || doc.name,
        value: docHref(entry.slug, locale, i18n),
        icon: doc.icon && <ConfigIcon name={doc.icon} className="size-4" />,
      },
    ]
  })
}

function createMenuItems(
  docs: ConfigDocsCategoryDocs,
  base: string,
  entries: Map<string, DocEntry>,
  locale?: string,
  i18n?: ConfigDocsI18N
): BranchedMenuItem[] {
  return docs.flatMap<BranchedMenuItem>((doc) => {
    if (doc.draft || doc.disabled) return []
    const path = [base, doc.slug?.split("/").filter(Boolean).join("/")]
      .filter(Boolean)
      .join("/")
    if (doc.docs?.length) {
      const children = collectDocuments(doc.docs, path, entries, locale, i18n)
      return children.length
        ? [{ label: (locale && doc.i18n?.[locale]) || doc.name, children }]
        : []
    }
    const entry = entries.get(path)
    return doc.slug && entry && !entry.draft && !entry.disabled
      ? [
          {
            label: (locale && doc.i18n?.[locale]) || doc.name,
            value: docHref(entry.slug, locale, i18n),
          },
        ]
      : []
  })
}

function DocsNav({
  categories = [],
  locale,
  i18n,
}: {
  categories?: ConfigDocsCategories
  locale?: string
  i18n?: ConfigDocsI18N
}) {
  const index = flattenDocs(categories, locale)
  const entries = new Map(index.map((entry) => [entry.contentPath, entry]))
  const menus = categories.map((category) => {
    const slug = category.slug.split("/").filter(Boolean).join("/")
    return {
      slug,
      hrefs: index
        .filter((entry) => entry.categorySlug === slug)
        .map((entry) => docHref(entry.slug, locale, i18n)),
      items: createMenuItems(category.docs, slug, entries, locale, i18n),
    }
  })
  const items = categories.flatMap((category) => {
    const slug = category.slug.split("/").filter(Boolean).join("/")
    const documents = index.filter((entry) => entry.categorySlug === slug)
    const first = documents.find((entry) => !entry.draft && !entry.disabled)
    if (!first) return []

    return [
      {
        slug,
        name: (locale && category.i18n?.[locale]) || category.name,
        href: docHref(first.slug, locale, i18n),
        hrefs: documents.map((entry) => docHref(entry.slug, locale, i18n)),
        icon: (
          <ConfigIcon
            name={category.icon}
            className="size-4 shrink-0 text-neutral-700"
          />
        ),
      },
    ]
  })

  return (
    <div className="grid h-full w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-border p-2">
      <DocsCategoryNav items={items} />
      <ScrollArea className="min-h-0">
        <DocsCategoryMenu categories={menus} />
      </ScrollArea>
      <a
        href="https://github.com/overl0ad1ng/code-altas"
        target="_blank"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border py-2"
      >
        <Logo />
        <span className="text-sm text-neutral-700 dark:text-neutral-300">
          Powered by CodeAltas
        </span>
      </a>
    </div>
  )
}

export { DocsNav }
