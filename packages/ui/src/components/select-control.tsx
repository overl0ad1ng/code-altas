"use client"

import { Select } from "@base-ui/react/select"
import { ChevronDown, Check } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "cn"

interface SelectControlProps {
  items: { value: string; label: string; lang?: string }[]
  value: string
  label: string
  onValueChange: (value: string) => void
  icon?: ReactNode
  className?: string
}

/** Shared appearance and keyboard behavior for header and page selectors. */
export function SelectControl({
  items,
  value,
  label,
  onValueChange,
  icon,
  className,
}: SelectControlProps) {
  return (
    <Select.Root
      items={items}
      value={value}
      modal={false}
      onValueChange={(next) => {
        if (next && next !== value) onValueChange(next)
      }}
    >
      <Select.Trigger
        aria-label={label}
        className={cn(
          "group flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:bg-accent",
          className
        )}
      >
        {icon}
        <Select.Value />
        <Select.Icon>
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 text-muted-foreground transition-transform group-data-[popup-open]:rotate-180 motion-reduce:transition-none"
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          alignItemWithTrigger={false}
          className="z-50"
        >
          <Select.Popup className="min-w-44 origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <Select.List className="max-h-[min(20rem,var(--available-height))] overflow-y-auto">
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  label={item.label}
                  lang={item.lang}
                  className="flex cursor-pointer items-center justify-between gap-6 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
