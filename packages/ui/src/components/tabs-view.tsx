"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "cn"
import { useRef, useState, type ReactNode } from "react"

import { SharedIndicator } from "./shared-indicator"

export interface TabsViewItem {
  name: string
  icon?: ReactNode
  children?: ReactNode
}

interface TabsViewProps {
  items: TabsViewItem[]
  defaultIndex: number
  className?: string
}

export function TabsView({ items, defaultIndex, className }: TabsViewProps) {
  const [selected, setSelected] = useState(defaultIndex)
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const active = Math.max(0, Math.min(selected, items.length - 1))
  const target = [hovered, focused, active].find(
    (value) => value !== null && items[value] !== undefined
  )

  return (
    <TabsPrimitive.Root
      value={active}
      onValueChange={(value: number) => setSelected(value)}
      className={cn("my-6 min-w-0", className)}
    >
      <TabsPrimitive.List
        ref={listRef}
        activateOnFocus
        aria-label="Document tabs"
        className="relative isolate flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border p-1"
        onPointerLeave={() => setHovered(null)}
        onPointerCancel={() => setHovered(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(null)
        }}
      >
        <SharedIndicator
          containerRef={listRef}
          target={target === undefined ? null : String(target)}
          data-slot="tabs-indicator"
          className="bg-neutral-100 dark:bg-neutral-700"
        />
        {items.map((item, index) => (
          <TabsPrimitive.Tab
            key={index}
            value={index}
            data-indicator-value={String(index)}
            className="relative z-10 flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap text-muted-foreground outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[active]:text-foreground"
            onPointerEnter={() => setHovered(index)}
            onFocus={() => setFocused(index)}
          >
            {item.icon}
            {item.name}
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>
      {items.map((item, index) => (
        <TabsPrimitive.Panel
          key={index}
          value={index}
          keepMounted
          className="min-w-0 pt-4 outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring data-[hidden]:hidden [&>h2:first-child]:mt-0 [&>h3:first-child]:mt-0 [&>p:first-child]:mt-0"
        >
          {item.children}
        </TabsPrimitive.Panel>
      ))}
    </TabsPrimitive.Root>
  )
}
