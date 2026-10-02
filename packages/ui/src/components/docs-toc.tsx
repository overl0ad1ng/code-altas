"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react"
import { createHeadingId } from "../lib/heading-id"
import { createTocTrack, type TocTrackRange } from "../lib/toc-track"

interface TocItem {
  id: string
  title: string
  depth: number
}

interface TocGeometry {
  path: string
  length: number
  height: number
  ranges: Record<string, TocTrackRange>
}

const headingSelector = "h2, h3, h4, h5, h6"
const offset = 80

function visible(element: HTMLElement) {
  return (
    !element.closest('[hidden], [data-hidden], [aria-hidden="true"]') &&
    element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== "hidden"
  )
}

export function DocsToc() {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<SVGPathElement>(null)
  const indicatorPositionRef = useRef<
    (TocTrackRange & { path: string }) | null
  >(null)
  const viewportRef = useRef<HTMLElement | null>(null)
  const headingsRef = useRef<HTMLElement[]>([])
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [geometry, setGeometry] = useState<TocGeometry>({
    path: "",
    length: 0,
    height: 0,
    ranges: {},
  })

  useEffect(() => {
    const article = anchorRef.current
      ?.closest("[data-doc-page]")
      ?.querySelector("article")
    const body = article?.querySelector<HTMLElement>("[data-doc-body]")
    const viewport = article?.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )
    if (!body || !viewport) return
    viewportRef.current = viewport
    let frame = 0
    let collectPending = false

    function updateActive() {
      if (!viewport) return
      const headings = headingsRef.current
      let active = headings[0]
      const threshold = viewport.getBoundingClientRect().top + offset + 1
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= threshold) active = heading
      }
      if (
        viewport.scrollHeight > viewport.clientHeight + 1 &&
        viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2
      )
        active = headings.at(-1)
      setActiveId(active?.id ?? null)
    }

    function collect() {
      if (!body) return
      // Reserve every explicit ID before generating IDs for custom MDX headings.
      const used = new Set(
        Array.from(
          document.querySelectorAll<HTMLElement>("[id]"),
          (node) => node.id
        )
      )
      const all = Array.from(
        body.querySelectorAll<HTMLElement>(headingSelector)
      )
      for (const heading of all) {
        if (!heading.id)
          heading.id = createHeadingId(heading.textContent?.trim() ?? "", used)
      }
      headingsRef.current = all.filter(visible)
      const next = headingsRef.current.map((heading) => ({
        id: heading.id,
        title: heading.textContent?.trim() ?? "",
        depth: Number(heading.tagName.slice(1)),
      }))
      setItems((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next
      )
    }

    function schedule(shouldCollect = false) {
      collectPending ||= shouldCollect
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (collectPending) {
          collectPending = false
          collect()
        }
        updateActive()
      })
    }

    function restoreHash() {
      if (!viewport) return
      let id: string
      try {
        id = decodeURIComponent(window.location.hash.slice(1))
      } catch {
        return
      }
      const heading = headingsRef.current.find((node) => node.id === id)
      if (!heading) return
      viewport.scrollTo({
        top:
          viewport.scrollTop +
          heading.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top -
          offset,
        behavior: "instant",
      })
      schedule()
    }

    collect()
    restoreHash()
    updateActive()
    const resize = new ResizeObserver(() => schedule(true))
    resize.observe(body)
    resize.observe(viewport)
    const mutations = new MutationObserver(() => schedule(true))
    mutations.observe(body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        "hidden",
        "data-hidden",
        "aria-hidden",
        "class",
        "style",
      ],
    })
    const onScroll = () => schedule()
    const onResize = () => schedule(true)
    viewport.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    window.addEventListener("hashchange", restoreHash)
    window.addEventListener("popstate", restoreHash)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      mutations.disconnect()
      viewport.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("hashchange", restoreHash)
      window.removeEventListener("popstate", restoreHash)
      viewportRef.current = null
      headingsRef.current = []
    }
  }, [])

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    function measure() {
      if (!list) return
      const origin = list.getBoundingClientRect()
      const rows = Array.from(list.children) as HTMLElement[]
      const track = createTocTrack(
        rows.map((row, index) => {
          const item = items[index]!
          const rect = row.getBoundingClientRect()
          return {
            id: item.id,
            depth: item.depth,
            top: rect.top - origin.top,
            height: rect.height,
          }
        })
      )
      const next = { ...track, height: list.offsetHeight }
      setGeometry((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next
      )
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(list)
    Array.from(list.children).forEach((row) => resize.observe(row))
    window.addEventListener("resize", measure)
    return () => {
      resize.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [items])

  useLayoutEffect(() => {
    const indicator = indicatorRef.current
    const target = activeId ? geometry.ranges[activeId] : undefined
    if (!indicator || !target) {
      indicatorPositionRef.current = null
      if (indicator) indicator.style.opacity = "0"
      return
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const previous = indicatorPositionRef.current
    let frame = 0
    function draw(range: TocTrackRange) {
      if (!indicator) return
      // Reveal a moving interval of the very same path used by the gray track.
      indicator.setAttribute(
        "stroke-dasharray",
        `${range.end - range.start} ${geometry.length}`
      )
      indicator.setAttribute("stroke-dashoffset", String(-range.start))
      indicator.style.opacity = "1"
      indicatorPositionRef.current = { ...range, path: geometry.path }
    }
    function finish() {
      cancelAnimationFrame(frame)
      draw(target!)
    }
    if (!previous || previous.path !== geometry.path || media.matches) finish()
    else {
      const started = performance.now()
      function animate(now: number) {
        const progress = Math.min(1, (now - started) / 240)
        const eased = 1 - (1 - progress) ** 3
        draw({
          start: previous!.start + (target!.start - previous!.start) * eased,
          end: previous!.end + (target!.end - previous!.end) * eased,
        })
        if (progress < 1) frame = requestAnimationFrame(animate)
      }
      frame = requestAnimationFrame(animate)
    }
    const onReducedMotion = () => {
      if (media.matches) finish()
    }
    media.addEventListener("change", onReducedMotion)
    return () => {
      cancelAnimationFrame(frame)
      media.removeEventListener("change", onReducedMotion)
    }
  }, [geometry, activeId])

  useEffect(() => {
    const list = listRef.current
    const scroller = scrollerRef.current
    const index = items.findIndex((item) => item.id === activeId)
    const row = list?.children[index]
    if (!scroller || !row) return
    const bounds = scroller.getBoundingClientRect()
    const rect = row.getBoundingClientRect()
    if (rect.top < bounds.top) scroller.scrollTop += rect.top - bounds.top
    else if (rect.bottom > bounds.bottom)
      scroller.scrollTop += rect.bottom - bounds.bottom
  }, [activeId, items])

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const viewport = viewportRef.current
    const heading = headingsRef.current.find((node) => node.id === id)
    if (!viewport || !heading) return
    event.preventDefault()
    const hash = `#${encodeURIComponent(id)}`
    if (window.location.hash !== hash)
      window.history.pushState(window.history.state, "", hash)
    viewport.scrollTo({
      top:
        viewport.scrollTop +
        heading.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top -
        offset,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    })
  }

  return (
    <>
      <span ref={anchorRef} hidden />
      {items.length > 0 && (
        <nav
          data-slot="docs-toc"
          aria-label="On this page"
          className="flex min-h-0 flex-col"
        >
          <p className="mb-3 shrink-0 text-sm font-medium text-foreground">
            On this page
          </p>
          <div
            ref={scrollerRef}
            className="min-h-0 overflow-y-auto overflow-x-visible overscroll-contain"
          >
            <div className="relative">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 overflow-visible text-border"
                width="50"
                height={geometry.height}
              >
                <path
                  d={geometry.path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  ref={indicatorRef}
                  aria-hidden="true"
                  data-slot="toc-active-indicator"
                  className="text-orange-500"
                  d={geometry.path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ opacity: 0 }}
                />
              </svg>
              <ol ref={listRef} className="relative">
                {items.map((item) => (
                  <li key={item.id} data-depth={item.depth}>
                    <a
                      href={`#${encodeURIComponent(item.id)}`}
                      onClick={(event) => navigate(event, item.id)}
                      aria-current={
                        item.id === activeId ? "location" : undefined
                      }
                      className="block py-2 pl-4 text-sm leading-5 wrap-anywhere text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring aria-[current=location]:text-orange-500"
                      style={{ marginLeft: (item.depth - 2) * 12 }}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
