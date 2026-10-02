"use client"

import { cn } from "cn"
import { Check, Copy } from "lucide-react"
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react"

export function CodeBlock({
  className,
  children,
  "data-title": title,
  style,
  ...props
}: ComponentPropsWithoutRef<"pre"> & { "data-title"?: string }) {
  const preRef = useRef<HTMLPreElement>(null)
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")
  const codeElement = Children.toArray(children).find((child) =>
    isValidElement(child)
  )
  const language = isValidElement<ComponentPropsWithoutRef<"code">>(codeElement)
    ? codeElement.props.className?.match(/(?:^|\s)language-([^\s]+)/)?.[1]
    : undefined
  const formattedChildren = Children.map(children, (child) => {
    if (!isValidElement<ComponentPropsWithoutRef<"code">>(child)) return child
    return cloneElement(child, {
      style: {
        ...child.props.style,
        display: "block",
        whiteSpace: "normal",
        lineHeight: "inherit",
      },
      children: Children.map(child.props.children, (line) => {
        if (
          !isValidElement<ComponentPropsWithoutRef<"span">>(line) ||
          !line.props.className?.split(/\s+/).includes("line")
        )
          return line
        return cloneElement(line, {
          style: {
            ...line.props.style,
            display: "grid",
            width: "100%",
            minHeight: "1lh",
            lineHeight: "inherit",
            gridTemplateColumns: "calc(3ch + 1.5rem) minmax(0, 1fr)",
            alignItems: "start",
          },
          children: (
            <span
              style={{
                display: "block",
                minWidth: 0,
                minHeight: "1lh",
                lineHeight: "inherit",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {line.props.children}
            </span>
          ),
        })
      }),
    })
  })

  useEffect(
    () => () => {
      if (resetRef.current) clearTimeout(resetRef.current)
    },
    []
  )

  async function copyCode() {
    const code = preRef.current?.textContent
    if (code == null) return

    if (resetRef.current) clearTimeout(resetRef.current)
    try {
      await navigator.clipboard.writeText(code)
      setStatus("copied")
    } catch {
      setStatus("error")
    }
    resetRef.current = setTimeout(() => setStatus("idle"), 2000)
  }

  const label =
    status === "copied"
      ? "Copied!"
      : status === "error"
        ? "Copy failed"
        : "Copy code"

  return (
    <div className="my-6 max-w-full min-w-0 overflow-hidden rounded-lg border border-border bg-neutral-100 p-1 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3 pb-1 pl-3">
        <span
          className="min-w-0 truncate font-mono text-xs text-muted-foreground"
          title={title || language || "text"}
        >
          {title || language || "text"}
        </span>
        <button
          type="button"
          onClick={copyCode}
          aria-label={label}
          title={label}
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-neutral-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:bg-neutral-800"
        >
          {status === "copied" ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
      <span role="status" className="sr-only">
        {status === "copied"
          ? "Code copied to clipboard."
          : status === "error"
            ? "Unable to copy code. Please try again."
            : ""}
      </span>
      <pre
        {...props}
        ref={preRef}
        style={{ ...style, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        className={cn(
          "codeblock-lines max-w-full min-w-0 rounded-md border border-border bg-white px-2 py-4 text-sm leading-6 dark:bg-neutral-950 [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0",
          className
        )}
      >
        {formattedChildren}
      </pre>
    </div>
  )
}
