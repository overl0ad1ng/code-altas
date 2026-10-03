"use client"

import { cn } from "cn"
import { Check, Copy } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

export interface MermaidViewProps {
  source: string
  title?: string
  className?: string
}

// One lazy import and a render queue prevent Mermaid's shared configuration
// and temporary DOM from interfering across multiple diagrams.
let mermaidModule: Promise<typeof import("mermaid")> | undefined
let renderQueue: Promise<unknown> = Promise.resolve()

function renderDiagram(id: string, source: string) {
  const task = renderQueue
    .catch(() => {})
    .then(async () => {
      const { default: mermaid } = await (mermaidModule ??= import("mermaid"))
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "strict",
        suppressErrorRendering: true,
      })
      await document.fonts.ready
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.visibility = "hidden"
      container.style.pointerEvents = "none"
      document.body.append(container)
      try {
        return (await mermaid.render(id, source, container)).svg
      } finally {
        container.remove()
      }
    })
  renderQueue = task
  return task
}

export function MermaidView({ source, title, className }: MermaidViewProps) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const [rendered, setRendered] = useState<{
    source: string
    svg?: string
    error?: string
  } | null>(null)
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  )
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let active = true
    if (!source.trim()) {
      // Use the same async path for empty input and renderer failures.
      Promise.resolve().then(() => {
        if (active) setRendered({ source, error: "Mermaid source is empty." })
      })
    } else {
      renderDiagram(id, source).then(
        (svg) => {
          if (active) setRendered({ source, svg })
        },
        (error: unknown) => {
          if (active)
            setRendered({
              source,
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to render Mermaid diagram.",
            })
        }
      )
    }
    return () => {
      active = false
    }
  }, [id, source])

  useEffect(
    () => () => {
      if (resetRef.current) clearTimeout(resetRef.current)
    },
    []
  )

  async function copySource() {
    if (resetRef.current) clearTimeout(resetRef.current)
    try {
      await navigator.clipboard.writeText(source)
      setCopyStatus("copied")
    } catch {
      setCopyStatus("error")
    }
    resetRef.current = setTimeout(() => setCopyStatus("idle"), 2000)
  }

  const current = rendered?.source === source ? rendered : null
  const copyLabel =
    copyStatus === "copied"
      ? "Copied!"
      : copyStatus === "error"
        ? "Copy failed"
        : "Copy Mermaid source"

  return (
    <div
      data-slot="mermaid-view"
      className={cn(
        "my-6 max-w-full min-w-0 overflow-hidden rounded-lg border border-border bg-neutral-100 p-1 dark:bg-neutral-900",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 pb-1 pl-3">
        <span
          className="min-w-0 truncate font-mono text-xs text-muted-foreground"
          title={title || "mermaid"}
        >
          {title || "mermaid"}
        </span>
        <button
          type="button"
          onClick={copySource}
          aria-label={copyLabel}
          title={copyLabel}
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-neutral-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:bg-neutral-800"
        >
          {copyStatus === "copied" ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
      <span role="status" className="sr-only">
        {copyStatus === "copied"
          ? "Mermaid source copied to clipboard."
          : copyStatus === "error"
            ? "Unable to copy source. Please try again."
            : ""}
      </span>
      <div
        className="mermaid-canvas overflow-x-auto rounded-md border border-border bg-white p-4 text-neutral-900"
        aria-busy={!current}
      >
        {current?.svg ? (
          <div
            role="img"
            aria-label={title || "Mermaid diagram"}
            dangerouslySetInnerHTML={{ __html: current.svg }}
          />
        ) : current?.error ? (
          <p
            role="alert"
            className="m-0 text-sm whitespace-pre-wrap text-red-700"
          >
            {current.error}
          </p>
        ) : (
          <p role="status" className="m-0 text-sm text-neutral-500">
            Loading diagram…
          </p>
        )}
      </div>
    </div>
  )
}
