import { cn } from "cn"
import { ChevronRight, File, Folder } from "lucide-react"

import { parseFileTree, type FileTreeNode } from "../../../lib/file-tree"

export interface FileTreeProps {
  files: readonly string[]
  className?: string
  defaultOpen?: boolean
  "aria-label"?: string
}

function FileTreeItems({
  nodes,
  defaultOpen,
}: {
  nodes: FileTreeNode[]
  defaultOpen: boolean
}) {
  return (
    <ul className="m-0 list-none space-y-1 p-0">
      {nodes.map((node) => (
        <li key={node.path} data-path={node.path}>
          {node.type === "directory" ? (
            <details
              open={defaultOpen}
              className="[&[open]>summary>svg:first-child]:rotate-90"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded px-2 py-1 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
                <Folder
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span>{node.name}</span>
              </summary>
              {node.children.length > 0 && (
                <div className="ml-3.5 border-l border-border pl-3">
                  <FileTreeItems
                    nodes={node.children}
                    defaultOpen={defaultOpen}
                  />
                </div>
              )}
            </details>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1 pl-7.5">
              <File
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span>{node.name}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Render relative file paths as a recursively collapsible directory listing. */
export function FileTree({
  files,
  className,
  defaultOpen = true,
  "aria-label": label = "File tree",
}: FileTreeProps) {
  const nodes = parseFileTree(files)
  if (!nodes.length) return null

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "my-6 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm",
        className
      )}
    >
      <FileTreeItems nodes={nodes} defaultOpen={defaultOpen} />
    </div>
  )
}
