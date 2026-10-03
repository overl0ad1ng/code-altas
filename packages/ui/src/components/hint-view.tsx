"use client"

import { cn } from "cn"
import { ChevronDown } from "lucide-react"
import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

interface HintContextValue {
  icon?: ReactNode
  collapsible: boolean
  collapsed: boolean
  toggle: () => void
  titleId: string
  contentId: string
}

const HintContext = createContext<HintContextValue | null>(null)

const hintColors = {
  default:
    "border-border bg-muted/50 [&_[data-slot=hint-title]]:text-foreground",
  info: "border-blue-500/30 bg-blue-500/10 [&_[data-slot=hint-title]]:text-blue-700 dark:[&_[data-slot=hint-title]]:text-blue-300",
  success:
    "border-emerald-500/30 bg-emerald-500/10 [&_[data-slot=hint-title]]:text-emerald-700 dark:[&_[data-slot=hint-title]]:text-emerald-300",
  warning:
    "border-amber-500/30 bg-amber-500/10 [&_[data-slot=hint-title]]:text-amber-800 dark:[&_[data-slot=hint-title]]:text-amber-300",
  danger:
    "border-red-500/30 bg-red-500/10 [&_[data-slot=hint-title]]:text-red-700 dark:[&_[data-slot=hint-title]]:text-red-300",
  error:
    "border-red-500/30 bg-red-500/10 [&_[data-slot=hint-title]]:text-red-700 dark:[&_[data-slot=hint-title]]:text-red-300",
  tip: "border-violet-500/30 bg-violet-500/10 [&_[data-slot=hint-title]]:text-violet-700 dark:[&_[data-slot=hint-title]]:text-violet-300",
}

export type HintType = keyof typeof hintColors

function useHint() {
  const context = useContext(HintContext)
  if (!context) throw new Error("HintTitle and HintContent must be inside Hint")
  return context
}

interface HintViewProps extends ComponentPropsWithoutRef<"aside"> {
  icon?: ReactNode
  type?: HintType
  allowCollapse?: boolean
  collapsed?: boolean
}

export function HintView({
  icon,
  type = "default",
  allowCollapse,
  collapsed,
  children,
  className,
  ...props
}: HintViewProps) {
  const id = useId()
  const collapsible = allowCollapse ?? collapsed !== undefined
  const [state, setState] = useState({
    prop: collapsed,
    collapsed: collapsed ?? true,
  })

  // Follow changes from the parent while allowing local toggles without a callback.
  if (state.prop !== collapsed) {
    setState({ prop: collapsed, collapsed: collapsed ?? true })
  }
  const isCollapsed = collapsible && state.collapsed

  return (
    <HintContext.Provider
      value={{
        icon,
        collapsible,
        collapsed: isCollapsed,
        toggle: () =>
          setState((previous) => ({
            ...previous,
            collapsed: !previous.collapsed,
          })),
        titleId: `${id}-title`,
        contentId: `${id}-content`,
      }}
    >
      <aside
        {...props}
        data-slot="hint"
        data-type={type}
        data-collapsed={isCollapsed}
        className={cn(
          "my-6 min-w-0 rounded-lg border p-4 text-foreground",
          hintColors[type],
          className
        )}
      >
        {children}
      </aside>
    </HintContext.Provider>
  )
}

export type HintTitleProps = ComponentPropsWithoutRef<"div">

export function HintTitle({
  children,
  className,
  onClick,
  onKeyDown,
  ...props
}: HintTitleProps) {
  const hint = useHint()
  return (
    <div
      {...props}
      data-slot="hint-title"
      role={hint.collapsible ? "button" : props.role}
      tabIndex={hint.collapsible ? 0 : props.tabIndex}
      aria-expanded={hint.collapsible ? !hint.collapsed : undefined}
      aria-controls={hint.collapsible ? hint.contentId : undefined}
      aria-labelledby={hint.collapsible ? hint.titleId : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (!hint.collapsible || event.defaultPrevented) return
        // Links and controls supplied by title components retain their own actions.
        if (
          (event.target as HTMLElement).closest(
            "a, button, input, select, textarea, [contenteditable=true]"
          )
        )
          return
        hint.toggle()
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (
          !hint.collapsible ||
          event.defaultPrevented ||
          event.target !== event.currentTarget
        )
          return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          hint.toggle()
        }
      }}
      className={cn(
        "flex min-w-0 items-start gap-2 text-sm font-semibold",
        hint.collapsible &&
          "cursor-pointer rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring",
        className
      )}
    >
      {hint.icon}
      <div id={hint.titleId} className="min-w-0 flex-1 wrap-anywhere [&>p]:m-0">
        {children}
      </div>
      {hint.collapsible && (
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 transition-transform motion-reduce:transition-none",
              !hint.collapsed && "rotate-180"
            )}
          />
        </span>
      )}
    </div>
  )
}

export type HintContentProps = ComponentPropsWithoutRef<"div">

export function HintContent({
  children,
  className,
  ...props
}: HintContentProps) {
  const hint = useHint()
  return (
    <div
      {...props}
      id={hint.contentId}
      data-slot="hint-content"
      aria-hidden={hint.collapsed}
      inert={hint.collapsed}
      style={{
        ...props.style,
        gridTemplateRows: hint.collapsed ? "0fr" : "1fr",
      }}
      className={cn(
        "grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        hint.collapsed ? "opacity-0" : "opacity-100",
        className
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="pt-2 text-sm leading-6 wrap-anywhere [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
}
