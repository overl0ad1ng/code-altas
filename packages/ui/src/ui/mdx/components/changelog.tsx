import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react"
import { cn } from "cn"
import { ChangelogTags } from "../../../components/changelog-tags"

export interface ChangelogProps {
  /** Calendar date in YYYY/MM/DD or YYYY-MM-DD format. */
  date: string
  title: string
  tags?: readonly string[]
  children?: ReactNode
  className?: string
}

export interface ChangelogsProps {
  children?: ReactNode
  /** Newest first by date, or preserve the order written in MDX. */
  sortBy?: "date" | "index"
  className?: string
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
})

function parseDate(value: string) {
  const match = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(value)
  if (!match) throw new Error(`Invalid changelog date: ${value}`)
  const year = match[1]!
  const month = match[2]!
  const day = match[3]!
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  const date = new Date(`${iso}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso)
    throw new Error(`Invalid changelog date: ${value}`)
  return { date, iso }
}

export function Changelog({
  date,
  title,
  tags = [],
  children,
  className,
}: ChangelogProps) {
  const parsed = parseDate(date)
  const names = [...new Set(tags)].filter((tag) => tag.trim())

  return (
    <article
      data-slot="changelog"
      className={cn(
        "relative grid min-w-0 gap-6 py-10 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-10 sm:py-12",
        className
      )}
    >
      <div className="min-w-0">
        <div data-slot="changelog-meta" className="sticky top-16 space-y-3">
          <time
            dateTime={parsed.iso}
            className="block text-sm leading-7 font-medium text-muted-foreground"
          >
            {dateFormatter.format(parsed.date)}
          </time>
          {names.length > 0 && <ChangelogTags tags={names} />}
        </div>
      </div>
      <div data-slot="changelog-content" className="min-w-0 wrap-anywhere">
        <h2 className="m-0 text-2xl leading-tight font-semibold tracking-tight">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </article>
  )
}

export function Changelogs({
  children,
  sortBy = "date",
  className,
}: ChangelogsProps) {
  const entries: ReactElement<ChangelogProps>[] = []
  function collect(nodes: ReactNode) {
    Children.forEach(nodes, (child) => {
      if (
        child == null ||
        typeof child === "boolean" ||
        (typeof child === "string" && !child.trim())
      )
        return
      if (
        isValidElement<{ children?: ReactNode }>(child) &&
        child.type === Fragment
      ) {
        collect(child.props.children)
        return
      }
      if (!isValidElement<ChangelogProps>(child) || child.type !== Changelog)
        throw new Error("Changelogs only accepts Changelog children")
      entries.push(child)
    })
  }
  collect(children)

  if (sortBy === "date") {
    entries.sort((a, b) => {
      return (
        parseDate(b.props.date).date.getTime() -
        parseDate(a.props.date).date.getTime()
      )
    })
  }
  if (!entries.length) return null

  return (
    <div
      data-slot="changelogs"
      className={cn("min-w-0 divide-y divide-border", className)}
    >
      {Children.toArray(entries)}
    </div>
  )
}
