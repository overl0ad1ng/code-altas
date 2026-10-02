import { Children, Fragment, isValidElement, type ReactNode } from "react"

import { ConfigIcon } from "../../../components/config-icon"
import { TabsView, type TabsViewItem } from "../../../components/tabs-view"

export interface TabProps {
  name: string
  icon?: string
  children?: ReactNode
}

export interface TabsProps {
  children: ReactNode
  className?: string
  defaultIndex?: number
}

/** Declarative content consumed by Tabs; icons are resolved on the server. */
export function Tab({ children }: TabProps) {
  return <>{children}</>
}

export function Tabs({ children, className, defaultIndex = 0 }: TabsProps) {
  const items: TabsViewItem[] = []
  function collect(nodes: ReactNode) {
    Children.forEach(nodes, (child) => {
      if (
        child == null ||
        typeof child === "boolean" ||
        (typeof child === "string" && !child.trim())
      )
        return
      if (
        isValidElement<{ children?: ReactNode }>(child) &&
        child.type === Fragment
      ) {
        collect(child.props.children)
        return
      }
      if (!isValidElement<TabProps>(child) || child.type !== Tab) {
        throw new Error("Tabs only accepts Tab children")
      }
      const { name, icon, children: content } = child.props
      items.push({
        name,
        icon: icon ? (
          <ConfigIcon name={icon} className="size-4 shrink-0" />
        ) : undefined,
        children: content,
      })
    })
  }

  collect(children)

  if (!items.length) return null

  const initial =
    Number.isInteger(defaultIndex) && items[defaultIndex] ? defaultIndex : 0

  return <TabsView items={items} defaultIndex={initial} className={className} />
}
