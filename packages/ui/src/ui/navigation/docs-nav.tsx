import { ScrollArea } from "../../primitives/scroll-area"
import { ConfigIcon } from "../../components/config-icon"
import { DocsCategoryNav } from "../../components/docs-category-nav"
import { DocsCategoryMenu } from "../../components/docs-category-menu"
import type {
  ConfigDocsCategories,
  ConfigDocsCategoryDocs,
} from "../../interface/Config"
import { docHref } from "../../lib/docs-navigation"
import { flattenDocs, type DocEntry } from "../../lib/docs-content"
import type {
  BranchedMenuChild,
  BranchedMenuItem,
} from "../../primitives/branched-menu"

function collectDocuments(
  docs: ConfigDocsCategoryDocs,
  base: string,
  entries: Map<string, DocEntry>
): BranchedMenuChild[] {
  return docs.flatMap((doc) => {
    if (doc.draft || doc.disabled) return []
    const path = [base, doc.slug?.split("/").filter(Boolean).join("/")]
      .filter(Boolean)
      .join("/")
    if (doc.docs?.length) return collectDocuments(doc.docs, path, entries)
    if (!doc.slug) return []
    const entry = entries.get(path)
    if (!entry || entry.draft || entry.disabled) return []
    return [
      {
        label: doc.name,
        value: docHref(entry.slug),
        icon: doc.icon && <ConfigIcon name={doc.icon} className="size-4" />,
      },
    ]
  })
}

function createMenuItems(
  docs: ConfigDocsCategoryDocs,
  base: string,
  entries: Map<string, DocEntry>
): BranchedMenuItem[] {
  return docs.flatMap<BranchedMenuItem>((doc) => {
    if (doc.draft || doc.disabled) return []
    const path = [base, doc.slug?.split("/").filter(Boolean).join("/")]
      .filter(Boolean)
      .join("/")
    if (doc.docs?.length) {
      const children = collectDocuments(doc.docs, path, entries)
      return children.length ? [{ label: doc.name, children }] : []
    }
    const entry = entries.get(path)
    return doc.slug && entry && !entry.draft && !entry.disabled
      ? [{ label: doc.name, value: docHref(entry.slug) }]
      : []
  })
}

function DocsNav({ categories = [] }: { categories?: ConfigDocsCategories }) {
  const index = flattenDocs(categories)
  const entries = new Map(index.map((entry) => [entry.contentPath, entry]))
  const menus = categories.map((category) => {
    const slug = category.slug.split("/").filter(Boolean).join("/")
    return {
      slug,
      hrefs: index
        .filter((entry) => entry.categorySlug === slug)
        .map((entry) => docHref(entry.slug)),
      items: createMenuItems(category.docs, slug, entries),
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
        name: category.name,
        href: docHref(first.slug),
        hrefs: documents.map((entry) => docHref(entry.slug)),
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
        href="https://code-altas.com/"
        target="_blank"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border py-2"
      >
        <img src="/logo-indev.png" className="size-6" />
        <span className="text-sm text-neutral-700">Powered by CodeAltas</span>
      </a>
    </div>
  )
}

export { DocsNav }
