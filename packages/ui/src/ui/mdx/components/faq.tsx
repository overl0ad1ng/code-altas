import { Children, Fragment, isValidElement, type ReactNode } from "react"

import { ConfigIcon } from "../../../components/config-icon"
import { FAQView, type FAQViewItem } from "../../../components/faq-view"

export interface QuestionProps {
  title: string
  icon?: string
  defaultOpen?: boolean
  children?: ReactNode
}

export interface FAQProps {
  children: ReactNode
  className?: string
}

/** Declarative content consumed by FAQ, never rendered independently. */
export function Question(_props: QuestionProps): never {
  throw new Error("Question must be inside FAQ")
}

export function FAQ({ children, className }: FAQProps) {
  const items: FAQViewItem[] = []
  let defaultIndex: number | undefined

  function collect(nodes: ReactNode) {
    Children.forEach(nodes, (child) => {
      if (
        child == null ||
        typeof child === "boolean" ||
        (typeof child === "string" && !child.trim())
      ) {
        return
      }
      
      if (isValidElement<{ children?: ReactNode }>(child) &&
        child.type === Fragment
      ) {
        collect(child.props.children)
        return
      }
      
      if (!isValidElement<QuestionProps>(child) || child.type !== Question) {
        throw new Error("FAQ only accepts Question children")
      }
      
      const { title, icon, defaultOpen, children: content } = child.props
      
      if (defaultOpen) {
        if (defaultIndex !== undefined) {
          throw new Error("FAQ only allows one Question with defaultOpen")
        }
        
        defaultIndex = items.length
      }
      
      items.push({
        title,
        icon: icon ? (
          <ConfigIcon name={icon} className="size-4 shrink-0" />
        ) : undefined,
        children: content,
      })
    })
  }

  collect(children)

  if (!items.length) return null

  return (
    <FAQView items={items} defaultIndex={defaultIndex} className={className} />
  )
}
