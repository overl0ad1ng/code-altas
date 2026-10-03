import { cn } from "cn"
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleX,
  FlaskConical,
  ArrowRight,
} from "lucide-react"
import type { ComponentPropsWithoutRef } from "react"

const states = {
  experimental: {
    label: "Experimental",
    icon: FlaskConical,
    color: "text-violet-700 dark:text-violet-300",
  },
  beta: {
    label: "Beta",
    icon: CircleDashed,
    color: "text-blue-700 dark:text-blue-300",
  },
  stable: {
    label: "Stable",
    icon: CircleCheck,
    color: "text-emerald-700 dark:text-emerald-300",
  },
  deprecated: {
    label: "Deprecated",
    icon: CircleAlert,
    color: "text-amber-800 dark:text-amber-300",
  },
  removed: { label: "Removed", icon: CircleX, color: "text-destructive" },
}

export type StatusType = keyof typeof states

export interface StatusProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> {
  /** Version in which the feature was introduced. */
  since: string
  deprecatedIn?: string
  removedIn?: string
  /** Overrides the props-based inference; no global current version is assumed. */
  status?: StatusType
}

export function Status({
  since,
  deprecatedIn,
  removedIn,
  status,
  className,
  ...props
}: StatusProps) {
  const resolvedStatus =
    status ?? (removedIn ? "removed" : deprecatedIn ? "deprecated" : "stable")
  const { label, icon: Icon, color } = states[resolvedStatus]
  const milestones = [
    { label: "Introduced", version: since },
    ...(deprecatedIn ? [{ label: "Deprecated", version: deprecatedIn }] : []),
    ...(removedIn
      ? [{ label: "Removed", version: removedIn }]
      : [{ label: "Supported through", version: null }]),
  ]

  return (
    <div
      {...props}
      data-slot="status"
      data-status={resolvedStatus}
      className={cn(
        "my-6 flex w-full min-w-0 flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border bg-accent px-4 py-3 text-sm text-foreground",
        className
      )}
    >
      <div
        className={cn(
          "flex w-34 shrink-0 items-center gap-2 font-medium",
          color
        )}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        <span>{label}</span>
      </div>
      <dl className="m-0 flex min-w-0 flex-[1_1_20rem] flex-wrap items-center gap-x-4 gap-y-2">
        {milestones.map((milestone, index) => (
          <div
            key={milestone.label}
            className="flex min-w-0 items-center gap-2"
          >
            {index > 0 && (
              <ArrowRight
                aria-hidden="true"
                className="size-3 shrink-0 text-muted-foreground"
              />
            )}
            <dt
              className={cn(
                "text-xs text-muted-foreground",
                !milestone.version && "sr-only"
              )}
            >
              {milestone.label}
            </dt>
            <dd
              className={cn(
                "m-0 min-w-0 wrap-anywhere",
                milestone.version
                  ? "font-mono text-xs font-medium"
                  : "text-xs text-muted-foreground"
              )}
            >
              {milestone.version
                ? `v${milestone.version.replace(/^v/i, "")}`
                : "Latest"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
