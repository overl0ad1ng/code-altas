import type { ReactNode } from "react"

export default function Template({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="docs-content-transition"
      className="min-w-0 animate-docs-content-enter motion-reduce:animate-none"
    >
      {children}
    </div>
  )
}
