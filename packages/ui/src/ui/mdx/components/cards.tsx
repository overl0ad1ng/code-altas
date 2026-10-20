import { cn } from "cn"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

import { ConfigIcon } from "../../../components/config-icon"

const cardColumns = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}

type CardColumns = keyof typeof cardColumns

export interface CardsProps extends ComponentPropsWithoutRef<"div"> {
  cols?: CardColumns | `${CardColumns}`
}

export function Cards({ cols = 2, className, ...props }: CardsProps) {
  return (
    <div
      {...props}
      data-slot="cards"
      className={cn(
        "my-6 grid w-full min-w-0 gap-4",
        cardColumns[cols],
        className
      )}
    />
  )
}

export interface CardProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "title"
> {
  title: ReactNode
  icon?: string
}

export function Card({
  title,
  icon,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      data-slot="card"
      className={cn(
        "min-w-0 rounded-lg border border-border bg-card p-5 text-card-foreground",
        className
      )}
    >
      <div
        data-slot="card-title"
        className="flex min-w-0 items-start gap-2.5 text-sm font-semibold"
      >
        {icon && <ConfigIcon name={icon} className="mt-0.5 size-4 shrink-0" />}
        <div className="min-w-0 wrap-anywhere [&>p]:m-0">{title}</div>
      </div>
      {children != null && (
        <div
          data-slot="card-content"
          className="mt-2 text-sm leading-6 wrap-anywhere text-muted-foreground [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
        >
          {children}
        </div>
      )}
    </div>
  )
}
