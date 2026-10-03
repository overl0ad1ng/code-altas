import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { DocPagination } from "../../lib/docs-navigation"
import type { DocsMessages } from "../../interface/Config"
import { docsMessages } from "../../lib/docs-i18n"

export function DocsPagination({
  previous,
  next,
  locale,
  messages = docsMessages(locale),
}: DocPagination & { locale?: string; messages?: DocsMessages }) {
  if (!previous && !next) return null

  return (
    <nav
      lang={locale}
      aria-label="Documentation pagination"
      className="mt-12 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2"
    >
      {previous && (
        <Link
          href={previous.href}
          rel="prev"
          className="group flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ChevronLeft
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              {messages.previous}
            </span>
            <span className="mt-1 block font-medium wrap-anywhere">
              {previous.name}
            </span>
          </span>
        </Link>
      )}
      {next && (
        <Link
          href={next.href}
          rel="next"
          className="group flex min-w-0 items-center justify-end gap-3 rounded-lg border border-border bg-background p-4 text-right transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:col-start-2"
        >
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              {messages.next}
            </span>
            <span className="mt-1 block font-medium wrap-anywhere">
              {next.name}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </Link>
      )}
    </nav>
  )
}
