import {
  Children,
  Fragment,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"
import { PreviewView } from "../../../components/preview-view"

export interface PreviewProps {
  children?: ReactNode
  playgroundUrl?: string
  /** Reserved for the external address of a future file-based source. */
  sourceUrl?: string
  /** Code line ranges, using fence metadata syntax: {2,4-6}. */
  highlight?: string
  className?: string
}

/** Internal compile-time source slot, consumed by Preview. */
export function PreviewCode({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Preview({ children, playgroundUrl, className }: PreviewProps) {
  let code: ComponentPropsWithoutRef<"pre"> | undefined
  const content = Children.toArray(children).filter((child) => {
    if (
      !isValidElement<{ children?: ReactNode }>(child) ||
      child.type !== PreviewCode
    )
      return true
    function findPre(nodes: ReactNode): ReactNode {
      for (const node of Children.toArray(nodes)) {
        if (!isValidElement<{ children?: ReactNode }>(node)) continue
        if (node.type === Fragment) {
          const found = findPre(node.props.children)
          if (found) return found
        } else return node
      }
    }
    const pre = findPre(child.props.children)
    if (isValidElement<ComponentPropsWithoutRef<"pre">>(pre)) code = pre.props
    return false
  })
  return (
    <PreviewView
      playgroundUrl={playgroundUrl}
      className={className}
      code={code}
    >
      {content}
    </PreviewView>
  )
}
