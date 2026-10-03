import type { ComponentPropsWithoutRef } from "react"

import { ConfigIcon } from "../../../components/config-icon"
import { HintView, type HintType } from "../../../components/hint-view"

export {
  HintTitle,
  HintContent,
  type HintTitleProps,
  type HintContentProps,
  type HintType,
} from "../../../components/hint-view"

export interface HintProps extends ComponentPropsWithoutRef<"aside"> {
  icon?: string
  type?: HintType
  /** Explicit false disables folding; otherwise a boolean collapsed enables it. */
  allowCollapse?: boolean
  /** True hides the content. Defaults to true when folding is enabled. */
  collapsed?: boolean
}

export function Hint({ icon, ...props }: HintProps) {
  return (
    <HintView
      {...props}
      icon={
        icon ? (
          <ConfigIcon name={icon} className="mt-0.5 size-4 shrink-0" />
        ) : undefined
      }
    />
  )
}
