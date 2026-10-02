"use client"

import { cn } from "cn"
import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type RefObject,
} from "react"

interface SharedIndicatorProps extends ComponentPropsWithoutRef<"span"> {
  containerRef: RefObject<HTMLElement | null>
  target: string | null | undefined
}

/** Position one background behind the matching data-indicator-value element. */
export function SharedIndicator({
  containerRef,
  target,
  className,
  ...props
}: SharedIndicatorProps) {
  const indicatorRef = useRef<HTMLSpanElement>(null)

  // The container belongs to our parent: its ref is ready after the commit,
  // but can still be null when this child's layout effect runs on first mount.
  useEffect(() => {
    const container = containerRef.current
    const indicator = indicatorRef.current
    if (!container || !indicator) return

    function update() {
      if (!container || !indicator) return
      const element = Array.from(
        container.querySelectorAll<HTMLElement>("[data-indicator-value]")
      ).find((item) => item.getAttribute("data-indicator-value") === target)
      if (!element) {
        indicator.style.opacity = "0"
        return
      }
      const bounds = container.getBoundingClientRect()
      const rect = element.getBoundingClientRect()
      indicator.style.transform = `translate(${rect.left - bounds.left - container.clientLeft + container.scrollLeft}px, ${rect.top - bounds.top - container.clientTop + container.scrollTop}px)`
      indicator.style.width = `${rect.width}px`
      indicator.style.height = `${rect.height}px`
      indicator.style.opacity = "1"
    }

    const resize = new ResizeObserver(update)
    function observe() {
      if (!container) return
      resize.disconnect()
      resize.observe(container)
      container
        .querySelectorAll<HTMLElement>("[data-indicator-value]")
        .forEach((item) => resize.observe(item))
      update()
    }
    observe()
    const mutations = new MutationObserver(observe)
    mutations.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-indicator-value"],
    })
    container.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      resize.disconnect()
      mutations.disconnect()
      container.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [containerRef, target])

  return (
    <span
      {...props}
      ref={indicatorRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0 rounded-lg opacity-0 transition-[transform,width,height,opacity] duration-200 ease-out motion-reduce:transition-none",
        className
      )}
    />
  )
}
