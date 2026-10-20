"use client"

import { Accordion } from "@base-ui/react/accordion"
import { cn } from "cn"
import { Plus } from "lucide-react"
import type { ReactNode } from "react"

export interface FAQViewItem {
  title: string
  icon?: ReactNode
  children?: ReactNode
}

interface FAQViewProps {
  items: FAQViewItem[]
  defaultIndex?: number
  className?: string
}

export function FAQView({ items, defaultIndex, className }: FAQViewProps) {
  return (
    <Accordion.Root
      multiple={false}
      defaultValue={defaultIndex === undefined ? [] : [defaultIndex]}
      data-slot="faq"
      className={cn(
        "my-6 min-w-0 overflow-hidden rounded-xl border border-border bg-background",
        className
      )}
    >
      {items.map((item, index) => (
        <Accordion.Item
          key={index}
          value={index}
          data-slot="faq-question"
          className="min-w-0 border-b border-border last:border-b-0"
        >
          <Accordion.Header className="m-0">
            <Accordion.Trigger
              data-slot="faq-trigger"
              className="group flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-panel-open:bg-muted/30 motion-reduce:transition-none"
            >
              {item.icon && (
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                >
                  {item.icon}
                </span>
              )}
              <span className="min-w-0 flex-1 wrap-break-word">
                {item.title}
              </span>
              <Plus
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-45 motion-reduce:transition-none"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel
            keepMounted
            data-slot="faq-answer"
            className="h-(--accordion-panel-height) min-w-0 overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"
          >
            <div
              className={cn(
                "px-5 pt-4 pb-5 text-sm leading-7 wrap-break-word text-muted-foreground [&>p:first-child]:mt-0 [&>p:last-child]:mb-0",
              )}
            >
              {item.children}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}
