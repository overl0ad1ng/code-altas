"use client"

import { Dialog } from "@base-ui/react/dialog"
import { SiGithub, SiNpm } from "@icons-pack/react-simple-icons"
import { CalendarDays, Flag, UserRound, X } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { ScrollArea } from "../primitives/scroll-area"
import type {
  RoadmapDefinition,
  RoadmapItemMetadata,
} from "../server/roadmap-schema"

export type RoadmapCardItem = RoadmapItemMetadata & {
  id: string
  preview: string
  content: ReactNode
}
export type RoadmapDisplayDefinition = Pick<
  RoadmapDefinition,
  "id" | "title"
> & { icon: ReactNode }

function GitHubAvatar({ user }: { user: string | number }) {
  const [failed, setFailed] = useState(false)
  const label = typeof user === "number" ? `GitHub user #${user}` : `@${user}`

  return failed ? (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground"
    >
      <UserRound aria-hidden="true" className="size-3.5" />
    </span>
  ) : (
    <img
      ref={(image) => {
        // An SSR image may fail before React attaches its error handler.
        if (image?.complete && image.naturalWidth === 0) setFailed(true)
      }}
      src={
        typeof user === "number"
          ? `https://avatars.githubusercontent.com/u/${user}?s=64&v=4`
          : `https://github.com/${user}.png?size=64`
      }
      alt={label}
      title={label}
      loading="lazy"
      referrerPolicy="no-referrer"
      width={28}
      height={28}
      onError={() => setFailed(true)}
      className="size-7 shrink-0 rounded-full border-2 border-background bg-muted object-cover"
    />
  )
}

function StatusBadge({ status }: { status: RoadmapDisplayDefinition }) {
  return (
    <span className="shrink-0 inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-normal wrap-anywhere">
      {status.icon}
      {status.title}
    </span>
  )
}

function CardPreview({ text }: { text: string }) {
  const container = useRef<HTMLSpanElement>(null)
  const content = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(false)

  useEffect(() => {
    const element = container.current
    const inner = content.current

    if (!element || !inner) return

    const update = () => setOverflow(element.scrollHeight > element.clientHeight + 1)

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    observer.observe(inner)

    return () => observer.disconnect()
  }, [text])

  return (
    <span
      ref={container}
      data-slot="roadmap-preview"
      className="relative block max-h-24 overflow-hidden"
    >
      <span
        ref={content}
        className="block text-sm leading-6 text-muted-foreground"
      >
        {text}
      </span>
      {overflow && (
        <span
          aria-hidden="true"
          data-slot="roadmap-preview-fade"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-b from-transparent to-background"
        />
      )}
    </span>
  )
}

function formatDate(date: string, includeYear = false) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

export function ReleaseLink({ text }: { text: string }) {
  let href = text
  if (text.startsWith("github:")) {
    href = `https://github.com/${text.slice("github:".length)}`
  } else if (text.startsWith("npm:")) {
    href = `https://www.npmjs.com/package/${text.slice("npm:".length)}`
  }

  if (!/^https?:\/\//i.test(href)) return text

  let url: URL
  try {
    url = new URL(href)
  } catch {
    return text
  }

  const domain = url.hostname.replace(/^www\.(github\.com|npmjs\.com)$/, "$1")
  const Icon =
    domain === "github.com" ? SiGithub : domain === "npmjs.com" ? SiNpm : null

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm wrap-anywhere underline-offset-4 hover:underline"
    >
      {Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
      {domain}
    </a>
  )
}

interface RoadmapCardProps {
  item: RoadmapCardItem
  group: RoadmapDisplayDefinition
  status: RoadmapDisplayDefinition
}

function ItemDetails({ item, group, status }: RoadmapCardProps) {
  return (
    <aside
      aria-label="Item details"
      className="min-w-0 border-t border-border bg-foreground/2 p-6 md:overflow-y-auto md:border-t-0 md:border-l"
    >
      <h3 className="mb-6 text-sm font-medium">Details</h3>
      <dl className="space-y-5 text-sm">
        <div>
          <dt className="mb-1.5 text-xs text-muted-foreground">Status</dt>
          <dd>
            <StatusBadge status={status} />
          </dd>
        </div>
        <div>
          <dt className="mb-1.5 text-xs text-muted-foreground">Group</dt>
          <dd className="flex items-center gap-2 wrap-anywhere">
            {group.icon}
            {group.title}
          </dd>
        </div>
        <div>
          <dt className="mb-1.5 text-xs text-muted-foreground">Priority</dt>
          <dd className="wrap-anywhere">{item.priority ?? "Not set"}</dd>
        </div>
        <div>
          <dt className="mb-1.5 text-xs text-muted-foreground">Due date</dt>
          <dd>
            {item.due ? (
              <time dateTime={item.due}>{formatDate(item.due, true)}</time>
            ) : (
              "Not set"
            )}
          </dd>
        </div>
        <div>
          <dt className="mb-2 text-xs text-muted-foreground">Participants</dt>
          <dd className="space-y-2">
            {item.assignees.length ? (
              item.assignees.map((user) => (
                <div
                  key={`${typeof user}:${user}`}
                  className="flex min-w-0 items-center gap-2"
                >
                  <GitHubAvatar user={user} />
                  {typeof user === "string" ? (
                    <a
                      href={`https://github.com/${user}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm wrap-anywhere underline-offset-4 hover:underline"
                    >
                      @{user}
                    </a>
                  ) : (
                    <span className="text-sm wrap-anywhere">User #{user}</span>
                  )}
                </div>
              ))
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </dd>
        </div>
        {
          item.release ? (
            <div>
              <dt className="mb-1.5 text-xs text-muted-foreground">Release</dt>
              <dd className="flex items-center gap-2 wrap-anywhere">
                <ReleaseLink text={item.release} />
              </dd>
            </div>
          ) : null
        }
        {Object.entries(item.properties).map(([name, value]) => (
          <div key={name}>
            <dt className="mb-1.5 text-xs wrap-anywhere text-muted-foreground">
              {name}
            </dt>
            <dd className="wrap-anywhere whitespace-pre-wrap">
              {String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}

export function RoadmapCard({ item, group, status }: RoadmapCardProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={`View ${item.title}`}
        data-slot="roadmap-card"
        className="flex w-full cursor-pointer flex-col gap-4 rounded-xl border border-transparent transition-colors bg-background p-3 text-left hover:border-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex w-full min-w-0 items-start justify-between gap-2">
          <span className="text-sm leading-6 font-medium wrap-anywhere">
            {item.title}
          </span>
          <StatusBadge status={status} />
        </span>
        <CardPreview
          text={item.preview || item.description || "No description yet."}
        />
        {(item.priority || item.due || item.assignees.length > 0) && (
          <span className="flex w-full items-center justify-between gap-3">
            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              {item.priority && (
                <span className="inline-flex min-w-0 items-center gap-1.5 wrap-anywhere">
                  <Flag aria-hidden="true" className="size-3.5 shrink-0" />
                  {item.priority}
                </span>
              )}
              {item.due && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="size-3.5" />
                  <time dateTime={item.due}>{formatDate(item.due)}</time>
                </span>
              )}
            </span>
            {item.assignees.length > 0 && (
              <span className="flex shrink-0 -space-x-1.5">
                {item.assignees.slice(0, 3).map((user) => (
                  <GitHubAvatar key={`${typeof user}:${user}`} user={user} />
                ))}
                {item.assignees.length > 3 && (
                  <span
                    className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground"
                    title={`${item.assignees.length - 3} more participants`}
                  >
                    +{item.assignees.length - 3}
                  </span>
                )}
              </span>
            )}
          </span>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex h-[min(80dvh,48rem)] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-xl outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none">
          <Dialog.Close
            aria-label="Close item details"
            className="absolute top-3 right-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-md bg-background text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" className="size-4" />
          </Dialog.Close>
          <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_17rem] md:overflow-hidden">
            <ScrollArea className="min-w-0 md:min-h-0">
              <article className="min-w-0 p-6 md:p-8">
                <Dialog.Title className="pr-8 text-2xl font-semibold tracking-tight wrap-anywhere">
                  {item.title}
                </Dialog.Title>
                <Dialog.Description
                  className={
                    item.description
                      ? "mt-3 text-sm leading-6 text-muted-foreground"
                      : "sr-only"
                  }
                >
                  {item.description ?? "Roadmap item details and properties."}
                </Dialog.Description>
                <div data-doc-body className="mt-6 min-w-0 wrap-anywhere">
                  {item.content}
                </div>
              </article>
            </ScrollArea>
            <ItemDetails item={item} group={group} status={status} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
