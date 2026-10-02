"use client"

import { ArrowUpIcon } from "lucide-react"
import type { MouseEvent } from "react"

export function AsideComponent() {
  function scrollTop(event: MouseEvent<HTMLButtonElement>) {
    const viewport = event.currentTarget
      .closest("[data-doc-page]")
      ?.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')
    viewport?.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={scrollTop}
        className="group w-full cursor-pointer rounded-lg border border-border bg-background p-1 duration-150 ease-out active:scale-98"
      >
        <span className="flex h-full w-full items-center justify-center gap-2 rounded-md px-2 py-0.5 text-sm text-muted-foreground duration-150 ease-out select-none group-hover:bg-accent">
          <ArrowUpIcon size={14} aria-hidden="true" />
          Scroll To Top
        </span>
      </button>
    </div>
  )
}
