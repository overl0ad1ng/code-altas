"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Search, X, FileText, Hash, Code } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useConfig } from "../lib/config-provider"
import { useDocsLocale } from "../lib/use-docs-locale"
import type { DocsMessages } from "../interface/Config"
import type { DocsSearchResponse, DocsSearchResult } from "../lib/docs-search"
import { ScrollArea } from "../primitives/scroll-area"
import { cn } from "cn"

interface DocsSearchProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerClassName?: string
}

function HighlightedSnippet({ result }: { result: DocsSearchResult }) {
  let end = 0
  const content = result.highlights.map((range, index) => {
    const before = result.snippet.slice(end, range.start)
    end = range.end
    return (
      <span key={index}>
        {before}
        <mark className="rounded-sm bg-orange-500/15 px-0.5 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300">
          {result.snippet.slice(range.start, range.end)}
        </mark>
      </span>
    )
  })
  return (
    <>
      {content}
      {result.snippet.slice(end)}
    </>
  )
}

function SearchDialog({
  api,
  locale,
  messages,
  open: controlledOpen,
  onOpenChange,
  triggerClassName,
}: {
  api: string
  locale?: string
  messages: DocsMessages
} & DocsSearchProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  function setOpen(value: boolean) {
    if (controlledOpen === undefined) setInternalOpen(value)
    onOpenChange?.(value)
  }
  const [query, setQuery] = useState("")
  const [retry, setRetry] = useState(0)
  const [active, setActive] = useState(0)
  const [response, setResponse] = useState<{
    query: string
    state: "ready" | "loading" | "error"
    results: DocsSearchResult[]
  }>({ query: "", state: "ready", results: [] })
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const trimmed = query.trim()
  const valid = /[\p{L}\p{N}]/u.test(trimmed)
  const results = response.query === trimmed ? response.results : []
  const selected = Math.min(active, Math.max(0, results.length - 1))
  const loading =
    valid && (response.query !== trimmed || response.state === "loading")

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        if (controlledOpen === undefined) setInternalOpen((value) => !value)
        onOpenChange?.(!open)
      }
    }
    window.addEventListener("keydown", shortcut)
    return () => window.removeEventListener("keydown", shortcut)
  }, [open, controlledOpen, onOpenChange])

  useEffect(() => {
    if (!open || !valid) return
    const controller = new AbortController()
    let current = true
    const timer = window.setTimeout(async () => {
      setResponse({ query: trimmed, state: "loading", results: [] })
      try {
        const url = new URL(api, window.location.origin)
        url.searchParams.set("q", trimmed)
        if (locale) url.searchParams.set("locale", locale)
        const result = await fetch(url, { signal: controller.signal })
        if (!result.ok) throw new Error("Search request failed")
        const data = (await result.json()) as DocsSearchResponse
        if (current)
          setResponse({ query: trimmed, state: "ready", results: data.results })
      } catch {
        if (current && !controller.signal.aborted)
          setResponse({ query: trimmed, state: "error", results: [] })
      }
    }, 200)
    return () => {
      current = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [api, locale, open, trimmed, valid, retry])

  useEffect(() => {
    list.current
      ?.querySelector(`[data-result-index="${selected}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [selected, results])

  function navigate(result: DocsSearchResult) {
    setOpen(false)
    router.push(result.url)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        ref={trigger}
        className={cn(
          "flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-muted-foreground transition-all duration-200 ease-out hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none",
          triggerClassName
        )}
        aria-label={messages.search}
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden lg:inline">{messages.search}</span>
        <kbd className="hidden rounded border border-border px-1 text-[10px] lg:inline">
          Ctrl/⌘ K
        </kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          initialFocus={input}
          finalFocus={trigger}
          className="fixed top-[12vh] left-1/2 z-50 flex max-h-[76dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl transition-[opacity,scale] duration-150 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 motion-reduce:transition-none"
        >
          <Dialog.Title className="sr-only">{messages.search}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {messages.searchEmpty}
          </Dialog.Description>
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3">
            <Search
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              ref={input}
              value={query}
              onChange={(event) => {
                setQuery([...event.target.value].slice(0, 100).join(""))
                setActive(0)
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return
                if (
                  (event.key === "ArrowDown" || event.key === "ArrowUp") &&
                  results.length
                ) {
                  event.preventDefault()
                  setActive(
                    (selected +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      results.length) %
                      results.length
                  )
                }
                if (event.key === "Enter" && results[selected]) {
                  event.preventDefault()
                  navigate(results[selected])
                }
              }}
              placeholder={messages.searchPlaceholder}
              aria-label={messages.search}
              role="combobox"
              aria-expanded={open}
              aria-autocomplete="list"
              aria-controls={listId}
              aria-activedescendant={
                results.length ? `${listId}-${selected}` : undefined
              }
              className="min-w-0 flex-1 bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground"
            />
            <Dialog.Close
              aria-label={messages.searchClose}
              className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <ScrollArea
            data-search-body=""
            className="min-h-0 overflow-hidden [&>[data-slot=scroll-area-viewport]]:h-auto [&>[data-slot=scroll-area-viewport]]:max-h-[min(32rem,calc(76dvh-4rem))]"
          >
            <div className="p-2">
              <div
                role="status"
                aria-live="polite"
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {!valid ? (
                  <p className="px-3 py-3">{messages.searchEmpty}</p>
                ) : loading ? (
                  <p className="px-3 py-3">{messages.searchLoading}</p>
                ) : response.state === "error" ? (
                  <div className="flex items-center justify-between gap-3 px-3 py-3">
                    <p>{messages.searchError}</p>
                    <button
                      className="cursor-pointer rounded-md border border-border px-3 py-1 hover:bg-accent"
                      onClick={() => setRetry((value) => value + 1)}
                    >
                      {messages.searchRetry}
                    </button>
                  </div>
                ) : !results.length ? (
                  <p className="px-3 py-3">{messages.searchNoResults}</p>
                ) : null}
                {valid &&
                  (trimmed.match(/[\p{L}\p{N}]/gu) ?? []).length === 1 && (
                    <p className="px-3 py-2 text-xs">
                      {messages.searchShortQuery}
                    </p>
                  )}
              </div>
              <div
                ref={list}
                id={listId}
                role="listbox"
                aria-label={messages.search}
                aria-busy={loading}
                className="space-y-1"
              >
                {results.map((result, index) => {
                  const Icon =
                    result.type === "heading"
                      ? Hash
                      : result.type === "code"
                        ? Code
                        : FileText
                  return (
                    <div
                      key={result.id}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={index === selected}
                      data-result-index={index}
                      onMouseMove={() => setActive(index)}
                      onClick={() => navigate(result)}
                      className={`flex cursor-pointer gap-3 rounded-xl px-3 py-3 transition-colors ${index === selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                    >
                      <Icon
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {result.type === "title" ? (
                            <HighlightedSnippet result={result} />
                          ) : (
                            result.title
                          )}
                        </p>
                        {result.heading && result.type !== "heading" && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {result.heading}
                          </p>
                        )}
                        {result.type !== "title" && (
                          <p className="mt-1 line-clamp-2 text-sm break-words text-muted-foreground">
                            <HighlightedSnippet result={result} />
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function DocsSearch(props: DocsSearchProps = {}) {
  const { docs } = useConfig()
  const pathname = usePathname()
  const { locale, messages } = useDocsLocale()
  if (!docs?.search) return null
  return (
    <SearchDialog
      key={`${pathname}:${locale}`}
      api={docs.search.api ?? "/api/search"}
      locale={locale}
      messages={messages}
      {...props}
    />
  )
}
