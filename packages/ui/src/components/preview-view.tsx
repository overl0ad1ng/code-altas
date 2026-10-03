"use client"

import { cn } from "cn"
import { ExternalLink } from "lucide-react"
import {
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"
import WarmTooltip from "../primitives/tooltip"
import { formatCodeLines } from "../ui/mdx/components/code-lines"
import { SharedIndicator } from "./shared-indicator"

export function PreviewView({
  children,
  code,
  playgroundUrl,
  className,
}: {
  children?: ReactNode
  code?: ComponentPropsWithoutRef<"pre">
  playgroundUrl?: string
  className?: string
}) {
  const id = useId()
  const [view, setView] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  return (
    <div
      data-slot="preview"
      className={cn(
        "my-6 w-full min-w-0 overflow-hidden rounded-lg border border-border bg-background",
        className
      )}
    >
      <div className="grid min-h-48 min-w-0">
        <div
          role="tabpanel"
          id={`${id}-panel-0`}
          aria-labelledby={`${id}-tab-0`}
          aria-hidden={view !== 0}
          inert={view !== 0}
          tabIndex={0}
          className={cn(
            "col-start-1 row-start-1 flex min-w-0 items-center justify-center overflow-auto p-6 focus-visible:outline-2 focus-visible:outline-ring",
            view !== 0 && "invisible"
          )}
        >
          {children}
        </div>
        <div
          role="tabpanel"
          id={`${id}-panel-1`}
          aria-labelledby={`${id}-tab-1`}
          aria-hidden={view !== 1}
          inert={view !== 1}
          tabIndex={0}
          className={cn(
            "col-start-1 row-start-1 min-w-0 overflow-x-auto bg-neutral-50 focus-visible:outline-2 focus-visible:outline-ring dark:bg-neutral-950",
            view !== 1 && "invisible"
          )}
        >
          {code ? (
            <pre
              {...code}
              style={{
                ...code.style,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
              className={cn(
                "shiki codeblock-lines m-0 min-h-full w-full max-w-full min-w-0 px-4 py-6 text-sm leading-6 [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0",
                code.className
              )}
            >
              {formatCodeLines(code.children)}
            </pre>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              Code view is available for MDX children compiled with
              experimentalComponentsInMDX enabled.
            </p>
          )}
        </div>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2 border-t border-border px-2 py-1.5">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Example view"
          className="relative isolate flex shrink-0 gap-1"
          onPointerLeave={() => setHovered(null)}
          onPointerCancel={() => setHovered(null)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setFocused(null)
          }}
        >
          <SharedIndicator
            containerRef={listRef}
            target={String(hovered ?? focused ?? view)}
            data-slot="preview-indicator"
            className="rounded-md bg-muted"
          />
          {["Preview", "Code"].map((label, index) => (
            <button
              key={label}
              ref={(element) => {
                tabs.current[index] = element
              }}
              id={`${id}-tab-${index}`}
              type="button"
              role="tab"
              data-indicator-value={String(index)}
              aria-selected={view === index}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={view === index ? 0 : -1}
              onClick={() => setView(index)}
              onPointerEnter={() => setHovered(index)}
              onFocus={() => setFocused(index)}
              onKeyDown={(event) => {
                let next: number
                if (event.key === "ArrowRight" || event.key === "ArrowLeft")
                  next = 1 - index
                else if (event.key === "Home") next = 0
                else if (event.key === "End") next = 1
                else return
                event.preventDefault()
                setView(next)
                tabs.current[next]?.focus()
              }}
              className={cn(
                "relative z-10 cursor-pointer rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                view === index && "text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {playgroundUrl && (
          <WarmTooltip content="Open in Playground">
            <a
              href={playgroundUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open in Playground"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </WarmTooltip>
        )}
      </div>
    </div>
  )
}
