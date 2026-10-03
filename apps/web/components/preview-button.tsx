"use client"

import { cn } from "cn"
import type { ComponentPropsWithoutRef } from "react"

/** Documentation demo: keep event handlers inside the client component. */
export function PreviewButton({
  alertMessage,
  className,
  variant = "default",
  ...props
}: Omit<ComponentPropsWithoutRef<"button">, "onClick"> & {
  alertMessage?: string
  variant?: "default" | "outline"
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
        variant === "outline"
          ? "border-border bg-background text-foreground hover:bg-muted active:bg-muted/80"
          : "border-transparent bg-primary text-primary-foreground hover:bg-primary/85 active:bg-primary/75",
        className
      )}
      onClick={alertMessage ? () => window.alert(alertMessage) : undefined}
    />
  )
}
