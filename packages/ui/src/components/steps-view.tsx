"use client"

import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react"
import {
  forwardRef,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

export interface StepsViewItem {
  label: string
  icon?: ReactNode
  children?: ReactNode
}

interface StepsViewProps {
  items: StepsViewItem[]
  defaultIndex: number
  className?: string
}

interface StepPanelProps {
  item: StepsViewItem
  index: number
  direction: number
  reduced: boolean
  labelId: string
}

const transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }

// popLayout forwards this ref to the exiting panel so it leaves normal flow.
const StepPanel = forwardRef<HTMLDivElement, StepPanelProps>(function StepPanel(
  { item, index, direction, reduced, labelId },
  ref
) {
  const present = useIsPresent()
  return (
    <motion.div
      ref={ref}
      data-slot="step-panel"
      data-step-index={index}
      role="region"
      aria-labelledby={present ? labelId : undefined}
      aria-hidden={!present}
      inert={!present}
      custom={direction}
      variants={{
        enter: (direction: number) => ({
          x: reduced ? 0 : `${direction * 100}%`,
          opacity: reduced ? 1 : 0,
          filter: reduced ? "blur(0px)" : "blur(6px)",
        }),
        current: { x: 0, opacity: 1, filter: "blur(0px)" },
        exit: (direction: number) => ({
          x: reduced ? 0 : `${direction * -100}%`,
          opacity: reduced ? 1 : 0,
          filter: reduced ? "blur(0px)" : "blur(6px)",
        }),
      }}
      initial="enter"
      animate="current"
      exit="exit"
      transition={reduced ? { duration: 0 } : transition}
      className="flow-root w-full min-w-0 p-4 [&>h2:first-child]:mt-0 [&>h3:first-child]:mt-0 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
    >
      {item.children}
    </motion.div>
  )
})

export function StepsView({ items, defaultIndex, className }: StepsViewProps) {
  const [selected, setSelected] = useState(defaultIndex)
  const [direction, setDirection] = useState(1)
  const [height, setHeight] = useState<number | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const reduced = useReducedMotion() ?? false
  const active = Math.max(0, Math.min(selected, items.length - 1))
  const item = items[active]

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const panel = viewport?.querySelector<HTMLElement>(
      `[data-step-index="${active}"]`
    )
    if (!viewport || !panel) return
    const measure = () =>
      setHeight(panel.getBoundingClientRect().height + viewport.clientTop * 2)
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(panel)
    return () => resize.disconnect()
  }, [active, items])

  if (!item) return null

  function move(delta: number) {
    setDirection(delta)
    setSelected((previous) =>
      Math.max(0, Math.min(previous + delta, items.length - 1))
    )
  }

  return (
    <div
      data-slot="steps"
      className={cn(
        "my-6 min-w-0 rounded-lg border border-border bg-accent p-1",
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-1.5">
        <div
          id={labelId}
          aria-live="polite"
          aria-atomic="true"
          className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground"
        >
          {item.icon}
          <span className="wrap-anywhere">{item.label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Previous step"
            disabled={active === 0}
            onClick={() => move(-1)}
            className="flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeftIcon size={12} aria-hidden="true" />
          </button>
          <span
            data-slot="steps-count"
            className="text-xs text-muted-foreground tabular-nums"
          >
            {active + 1} / {items.length}
          </span>
          <button
            type="button"
            aria-label="Next step"
            disabled={active === items.length - 1}
            onClick={() => move(1)}
            className="flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRightIcon size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        data-slot="steps-viewport"
        style={{ height: height ?? undefined }}
        className="relative overflow-hidden rounded-lg border border-border bg-background transition-[height] duration-300 ease-out motion-reduce:transition-none"
      >
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          <StepPanel
            key={active}
            item={item}
            index={active}
            direction={direction}
            reduced={reduced}
            labelId={labelId}
          />
        </AnimatePresence>
      </div>
    </div>
  )
}
