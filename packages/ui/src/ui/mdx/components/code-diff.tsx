import { cn } from "cn"
import {
  Children,
  Fragment,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

import { CodeBlock } from "./code-block"

export interface CodeDiffProps {
  children: ReactNode
  className?: string
}

type Line = { text: string; content: ReactNode; number: number }
type Block = { lines: Line[]; title?: string; language?: string }
type Edit = { kind: "equal" | "delete" | "insert"; line: Line }
type Row = { left?: Line; right?: Line; changed: boolean }

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (isValidElement<{ children?: ReactNode }>(node))
    return textContent(node.props.children)
  return Children.toArray(node).map(textContent).join("")
}

function readBlocks(children: ReactNode): Block[] {
  const blocks: Block[] = []
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
      if (
        !isValidElement<
          ComponentPropsWithoutRef<"pre"> & { "data-title"?: string }
        >(child) ||
        (child.type !== CodeBlock && child.type !== "pre")
      )
        throw new Error("CodeDiff only accepts fenced code blocks")
      const code = Children.toArray(child.props.children).find((node) =>
        isValidElement(node)
      )
      if (!isValidElement<ComponentPropsWithoutRef<"code">>(code))
        throw new Error("CodeDiff requires a code element in each block")
      const highlighted = Children.toArray(code.props.children).filter(
        (node) =>
          isValidElement<ComponentPropsWithoutRef<"span">>(node) &&
          node.props.className?.split(/\s+/).includes("line")
      )
      const raw = textContent(code.props.children)
        .replace(/\r\n?/g, "\n")
        .replace(/\n$/, "")
      const contents = highlighted.length
        ? highlighted.map((node) =>
            isValidElement<{ children?: ReactNode }>(node)
              ? node.props.children
              : node
          )
        : raw === ""
          ? []
          : raw.split("\n")
      // Shiki represents an entirely empty fence with a single empty line.
      const lines =
        contents.length === 1 && textContent(contents[0]) === ""
          ? []
          : contents.map((content, index) => ({
              content,
              text: textContent(content),
              number: index + 1,
            }))
      blocks.push({
        lines,
        title: child.props["data-title"],
        language: code.props.className?.match(/(?:^|\s)language-([^\s]+)/)?.[1],
      })
    })
  }
  collect(children)
  if (blocks.length !== 2)
    throw new Error("CodeDiff requires exactly two fenced code blocks")
  return blocks
}

/** Myers shortest edit script; ties favor deletion for stable repeated-line diffs. */
function diffLines(before: Line[], after: Line[]): Edit[] {
  const frontier = new Map<number, number>([[1, 0]])
  const trace: Map<number, number>[] = []
  for (let distance = 0; distance <= before.length + after.length; distance++) {
    trace.push(new Map(frontier))
    for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
      let x =
        diagonal === -distance ||
        (diagonal !== distance &&
          (frontier.get(diagonal - 1) ?? -Infinity) <
            (frontier.get(diagonal + 1) ?? -Infinity))
          ? (frontier.get(diagonal + 1) ?? 0)
          : (frontier.get(diagonal - 1) ?? 0) + 1
      let y = x - diagonal
      while (
        x < before.length &&
        y < after.length &&
        before[x]!.text === after[y]!.text
      ) {
        x++
        y++
      }
      frontier.set(diagonal, x)
      if (x < before.length || y < after.length) continue
      const edits: Edit[] = []
      for (let d = distance; d >= 0; d--) {
        const previous = trace[d]!
        const k = x - y
        const previousK =
          k === -d ||
          (k !== d &&
            (previous.get(k - 1) ?? -Infinity) <
              (previous.get(k + 1) ?? -Infinity))
            ? k + 1
            : k - 1
        const previousX = previous.get(previousK) ?? 0
        const previousY = previousX - previousK
        while (x > previousX && y > previousY) {
          edits.push({ kind: "equal", line: before[--x]! })
          y--
        }
        if (d === 0) break
        if (x === previousX) edits.push({ kind: "insert", line: after[--y]! })
        else edits.push({ kind: "delete", line: before[--x]! })
      }
      return edits.reverse()
    }
  }
  return []
}

function alignRows(before: Line[], after: Line[]): Row[] {
  const rows: Row[] = []
  let deleted: Line[] = []
  let inserted: Line[] = []
  let rightIndex = 0
  function flush() {
    for (let i = 0; i < Math.max(deleted.length, inserted.length); i++)
      rows.push({ left: deleted[i], right: inserted[i], changed: true })
    deleted = []
    inserted = []
  }
  for (const edit of diffLines(before, after)) {
    if (edit.kind === "delete") deleted.push(edit.line)
    else if (edit.kind === "insert") {
      inserted.push(edit.line)
      rightIndex++
    } else {
      flush()
      rows.push({ left: edit.line, right: after[rightIndex++], changed: false })
    }
  }
  flush()
  return rows
}

export function CodeDiff({ children, className }: CodeDiffProps) {
  const [before, after] = readBlocks(children) as [Block, Block]
  const rows = alignRows(before.lines, after.lines)
  const digits = String(
    Math.max(before.lines.length, after.lines.length, 1)
  ).length
  return (
    <div
      data-slot="code-diff"
      className={cn(
        "@container my-6 min-w-0 overflow-hidden rounded-lg border border-border text-sm",
        className
      )}
    >
      <div className="grid grid-cols-2 border-b border-border bg-muted">
        {[before, after].map((block, index) => (
          <div
            key={index}
            className="flex min-w-0 items-center justify-between gap-2 px-1 py-2 first:border-r first:border-border @min-[320px]:px-3"
          >
            <span className="truncate font-medium" title={block.title}>
              {block.title || (index === 0 ? "Before" : "After")}
            </span>
            {block.language && (
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {block.language}
              </span>
            )}
          </div>
        ))}
      </div>
      <div
        className="font-mono leading-6"
        role="table"
        aria-label="Code differences"
      >
        {rows.map((row, index) => (
          <div
            key={index}
            role="row"
            data-slot="code-diff-row"
            className="grid grid-cols-2"
          >
            {[row.left, row.right].map((line, side) => (
              <div
                key={side}
                role="cell"
                data-side={side === 0 ? "before" : "after"}
                data-change={
                  !line
                    ? "empty"
                    : !row.changed
                      ? "equal"
                      : side === 0
                        ? "delete"
                        : "insert"
                }
                className={cn(
                  "grid min-h-6 min-w-0 items-start first:border-r first:border-border",
                  !line
                    ? "bg-muted/50"
                    : !row.changed
                      ? "bg-white dark:bg-neutral-950"
                      : side === 0
                        ? "bg-red-100/70 dark:bg-red-950/50"
                        : "bg-green-100/70 dark:bg-green-950/50"
                )}
                style={{
                  gridTemplateColumns: `calc(${digits}ch + 0.5rem) 1.5rem minmax(0, 1fr)`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="px-2 text-right text-xs leading-6 text-muted-foreground select-none"
                >
                  {line?.number}
                </span>
                <span aria-hidden="true" className="text-center select-none">
                  {line && row.changed ? (side === 0 ? "-" : "+") : ""}
                </span>
                <span className="shiki min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap @min-[320px]:pr-3">
                  {line && row.changed && (
                    <span className="sr-only">
                      {side === 0 ? "Deleted: " : "Added: "}
                    </span>
                  )}
                  {line?.content}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
