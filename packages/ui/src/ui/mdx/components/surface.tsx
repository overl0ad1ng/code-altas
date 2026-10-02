import { cn } from "cn"

import React from "react"

export interface SurfaceProps {
  children: React.ReactNode
  name?: string
  description?: string
}

export function Surface({ children, name, description }: SurfaceProps) {
  return (
    <div className="bg-accent rounded-lg border border-border p-1">
      <div className="px-3 py-2 flex items-center justify-between dark:text-neutral-400 text-neutral-700">
        {name && <span className="text-sm font-medium">{name}</span>}
        {description && <span className="text-xs">{description}</span>}
      </div>
      <div className="dark:bg-background bg-white rounded-lg border border-border p-1">
        {children}
      </div>
    </div>
  )
}
