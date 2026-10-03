"use client"

import { cn } from "cn"
import { ChevronRightIcon } from "lucide-react"
import React, {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
export interface BranchedMenuChild {
  value: string
  label: string
  icon?: ReactNode
  children?: BranchedMenuChild[]
}

export interface BranchedMenuItem {
  label: string
  value?: string
  icon?: ReactNode
  children?: BranchedMenuChild[]
}

export interface BranchedMenuProps {
  items?: BranchedMenuItem[]
  defaultOpen?: number | number[]
  defaultActive?: string
  active?: string
  onSelect?: (value: string, item: BranchedMenuChild | BranchedMenuItem) => void
  onToggle?: (index: number, open: boolean) => void
  color?: string
  accentColor?: string
  lineColor?: string
  width?: number
  rowHeight?: number
  indent?: number
  trunk?: number
  radius?: number
  lineWidth?: number
  fontSize?: number
  drawDuration?: number
  foldDuration?: number
  className?: string
}

const PAD = 6
const MARK = 16

const toSet = (open: number | number[]) =>
  new Set((Array.isArray(open) ? open : open >= 0 ? [open] : []).map(String))

function containsActive(item: BranchedMenuItem, active: string): boolean {
  return (
    item.value === active ||
    Boolean(item.children?.some((child) => containsActive(child, active)))
  )
}

function activeAncestors(
  items: BranchedMenuItem[],
  active: string,
  parent = ""
): string[] {
  return items.flatMap((item, index) => {
    const key = parent ? `${parent}.${index}` : String(index)
    return item.children?.length && containsActive(item, active)
      ? [key, ...activeAncestors(item.children, active, key)]
      : []
  })
}

function firstLeaf(item: BranchedMenuItem): string {
  return item.children?.length
    ? firstLeaf(item.children[0]!)
    : (item.value ?? item.label)
}

const BranchedMenu: React.FC<BranchedMenuProps> = ({
  items = [],
  defaultOpen = 0,
  defaultActive = "",
  active: controlledActive,
  onSelect,
  onToggle,
  color = "#f5f5f5",
  accentColor = "#f5f5f5",
  lineColor = "#3f3f46",
  width = 240,
  rowHeight = 28,
  indent = 28,
  trunk = 8,
  radius = 10,
  lineWidth = 1,
  fontSize = 14,
  drawDuration = 400,
  foldDuration = 300,
  className = "",
}) => {
  const [internalActive, setActive] = useState(() => {
    if (defaultActive) return defaultActive
    const first = items.find(
      (it, i) => it.children?.length && toSet(defaultOpen).has(String(i))
    )
    return first ? firstLeaf(first) : ""
  })
  const active = controlledActive ?? internalActive
  const [open, setOpen] = useState(
    () => new Set([...toSet(defaultOpen), ...activeAncestors(items, active)])
  )
  const navRef = useRef<HTMLElement>(null)
  const heads = useRef<(HTMLButtonElement | null)[]>([])
  const rows = useRef(new Map<string, HTMLButtonElement>())
  const branches = useRef(new Map<string, HTMLDivElement>())
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({})
  const markerRef = useRef<HTMLSpanElement>(null)
  const latest = useRef<{
    onSelect?: BranchedMenuProps["onSelect"]
    onToggle?: BranchedMenuProps["onToggle"]
  }>({})
  latest.current = { onSelect, onToggle }

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
      const heights = Object.fromEntries(
        [...rows.current, ...branches.current].map(([value, element]) => [
          value,
          element.getBoundingClientRect().height,
        ])
      )
      setRowHeights((previous) =>
        Object.keys(previous).length === Object.keys(heights).length &&
        Object.entries(heights).every(
          ([value, height]) => previous[value] === height
        )
          ? previous
          : heights
      )
    })
    for (const element of rows.current.values()) observer.observe(element)
    for (const element of branches.current.values()) observer.observe(element)
    return () => observer.disconnect()
  }, [items, fontSize, rowHeight])

  const activeSection = items.findIndex((it) =>
    it.children?.some((kid) => containsActive(kid, active))
  )
  const markerShown = activeSection >= 0 && open.has(String(activeSection))
  const previousActive = useRef(active)
  useLayoutEffect(() => {
    if (previousActive.current === active) return
    previousActive.current = active
    const ancestors = activeAncestors(items, active)
    setOpen((previous) => new Set([...previous, ...ancestors]))
  }, [active, items])
  useLayoutEffect(() => {
    const place = (glide: boolean) => {
      const m = markerRef.current
      const el = heads.current[activeSection]
      if (!m) return
      const on = markerShown && el
      if (!glide) m.style.transition = "none"
      if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`
      m.toggleAttribute("data-on", Boolean(on))
      if (!glide) {
        void m.offsetHeight
        m.style.transition = ""
      }
    }
    place(true)
    let first = true
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false
        return
      }
      place(false)
    })
    if (navRef.current) ro.observe(navRef.current)
    return () => ro.disconnect()
  }, [activeSection, markerShown, items, fontSize, rowHeight])

  const select = (
    value: string,
    item: BranchedMenuChild | BranchedMenuItem
  ) => {
    setActive(value)
    latest.current.onSelect?.(value, item)
  }
  const toggle = (key: string) => {
    const isOpen = !open.has(key)
    setOpen((prev) => {
      const next = new Set(prev)
      if (isOpen) next.add(key)
      else next.delete(key)
      return next
    })
    if (!key.includes(".")) latest.current.onToggle?.(Number(key), isOpen)
  }

  const r = Math.min(radius, rowHeight / 2 - 2)
  const endX = indent - 8

  const renderItems = (
    nodes: BranchedMenuItem[],
    parent = "",
    visible = true
  ): ReactNode =>
    nodes.map((item, i) => {
      const key = parent ? `${parent}.${i}` : String(i)
      const nested = Boolean(parent)
      const kids = item.children?.length ? item.children : undefined
      const isOpen = kids ? open.has(key) : false
      const leafValue = item.value ?? item.label
      const leafActive = !kids && leafValue === active
      let cursor = PAD
      const centers =
        kids?.map((kid, k) => {
          const childKey = `${key}.${k}`
          const height = rowHeights[`branch:${childKey}`] ?? rowHeight
          const center = cursor + (rowHeights[childKey] ?? rowHeight) / 2
          cursor += height
          return center
        }) ?? []
      const bodyH = cursor + PAD
      const rowY = (k: number) => centers[k] ?? PAD + rowHeight / 2
      const branch = (k: number) =>
        `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`
      const reach = (k: number) =>
        `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`
      const length = (k: number) =>
        rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r)
      return (
        <div
          key={key}
          ref={(element) => {
            if (element) branches.current.set(`branch:${key}`, element)
            else branches.current.delete(`branch:${key}`)
          }}
          className="flex min-w-0 flex-col"
          data-open={isOpen ? "" : undefined}
        >
          <button
            ref={(el) => {
              if (!nested) heads.current[i] = el
              if (el) rows.current.set(key, el)
              else rows.current.delete(key)
            }}
            type="button"
            className={cn(
              "m-0 flex min-w-0 cursor-pointer items-center justify-between gap-2 border-0 bg-transparent pr-2 text-left [font-family:inherit] [color:var(--bm-muted)] outline-none [-webkit-tap-highlight-color:transparent] [transition:color_200ms_ease] hover:[color:var(--bm-ink)] data-[active]:[color:var(--bm-accent)] data-[open]:[color:var(--bm-ink)]",
              nested
                ? "min-h-[var(--bm-row)] py-1 [padding-left:var(--bm-indent)]"
                : "py-[9px] [font-size:calc(var(--bm-font)+1px)]"
            )}
            aria-expanded={kids ? isOpen : undefined}
            aria-current={leafActive ? "true" : undefined}
            data-active={leafActive ? "" : undefined}
            data-open={isOpen ? "" : undefined}
            tabIndex={visible ? 0 : -1}
            onClick={() => (kids ? toggle(key) : select(leafValue, item))}
          >
            {item.icon ? (
              <span className="inline-flex size-4 flex-none" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1 wrap-anywhere whitespace-normal">
              {item.label}
            </span>
            {(!nested || kids) && (
              <ChevronRightIcon
                className={cn(
                  "size-3 shrink-0 duration-200 ease-out",
                  isOpen && "rotate-90"
                )}
              />
            )}
          </button>
          {kids ? (
            <div
              className="grid [transition:grid-template-rows_var(--bm-fold)_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              style={{
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                marginLeft: nested ? indent : undefined,
              }}
              aria-hidden={!visible || !isOpen}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="relative box-border min-w-0 py-1.5">
                  <svg
                    className="pointer-events-none absolute top-0 left-0 overflow-visible [transition:opacity_200ms_ease]"
                    style={{ opacity: isOpen ? 1 : 0 }}
                    width={indent}
                    height={bodyH}
                    aria-hidden="true"
                  >
                    <path
                      className="fill-none [stroke:var(--bm-line)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round]"
                      d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`}
                    />
                    {kids.map((kid, k) => (
                      <path
                        key={kid.value}
                        className="fill-none [stroke:var(--bm-line)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round]"
                        d={branch(k)}
                      />
                    ))}
                    {kids.map((kid, k) => (
                      <path
                        key={kid.value}
                        className="fill-none [stroke:var(--bm-accent)] [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round] [transition:stroke-dashoffset_var(--bm-draw)_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                        d={reach(k)}
                        style={{
                          strokeDasharray: length(k),
                          strokeDashoffset: containsActive(kid, active)
                            ? 0
                            : length(k),
                        }}
                      />
                    ))}
                  </svg>
                  {renderItems(kids, key, visible && isOpen)}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )
    })

  return (
    <nav
      ref={navRef}
      className={`relative flex w-fit max-w-[min(var(--bm-w),100%)] min-w-0 flex-col pl-3.5 [font-family:inherit] [font-size:var(--bm-font)] leading-[1.2] [color:var(--bm-ink)] before:absolute before:top-2 before:bottom-0 before:left-0 before:w-0.5 before:rounded-[1px] before:[background:linear-gradient(to_bottom,var(--bm-line)_0%,var(--bm-line)_55%,transparent_100%)] before:content-['']${className ? ` ${className}` : ""}`}
      style={
        {
          "--bm-w": `${width}px`,
          "--bm-ink": color,
          "--bm-accent": accentColor,
          "--bm-line": lineColor,
          "--bm-font": `${fontSize}px`,
          "--bm-row": `${rowHeight}px`,
          "--bm-indent": `${indent}px`,
          "--bm-line-w": lineWidth,
          "--bm-draw": `${drawDuration}ms`,
          "--bm-muted": `color-mix(in srgb, ${color} 55%, transparent)`,
          "--bm-fold": `${foldDuration}ms`,
        } as CSSProperties
      }
    >
      <span
        ref={markerRef}
        className="absolute -top-px left-0 z-[1] h-4 w-0.5 rounded-[1px] opacity-0 [background:var(--bm-accent)] [transition:top_220ms_cubic-bezier(0.23,1,0.32,1),opacity_150ms_ease] data-[on]:opacity-100 motion-reduce:[transition:opacity_150ms_ease]"
        aria-hidden="true"
      />
      {renderItems(items)}
    </nav>
  )
}

export default BranchedMenu
