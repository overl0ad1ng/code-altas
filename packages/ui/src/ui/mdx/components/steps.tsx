import { Children, Fragment, isValidElement, type ReactNode } from "react"

import { ConfigIcon } from "../../../components/config-icon"
import { StepsView, type StepsViewItem } from "../../../components/steps-view"

export interface StepProps {
  label: string
  icon?: string
  children?: ReactNode
}

export interface StepsProps {
  children: ReactNode
  className?: string
  defaultIndex?: number
}

/** Declarative content consumed by Steps; icons are resolved on the server. */
export function Step({ children }: StepProps) {
  return <>{children}</>
}

export function Steps({ children, className, defaultIndex = 0 }: StepsProps) {
  const items: StepsViewItem[] = []
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
      if (!isValidElement<StepProps>(child) || child.type !== Step) {
        throw new Error("Steps only accepts Step children")
      }
      const { label, icon, children: content } = child.props
      items.push({
        label,
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
  return (
    <StepsView items={items} defaultIndex={initial} className={className} />
  )
}
