import { cn } from "cn"

import type { ConfigDocs } from "../../../interface/Config"

export interface TagsProps {
  tags: readonly string[]
  colors?: ConfigDocs["tags"]
  className?: string
}

/** Display only tags defined in docs.tags, in frontmatter order. */
export function Tags({ tags, colors = {}, className }: TagsProps) {
  const names = [...new Set(tags)].filter(
    (name) => Object.hasOwn(colors, name) && colors[name]?.trim()
  )
  if (!names.length) return null

  return (
    <ul
      aria-label="Tags"
      className={cn("m-0 flex list-none flex-wrap gap-2 p-0", className)}
    >
      {names.map((name) => (
        <li
          key={name}
          className="rounded-full border px-2 py-0.5 text-sm font-medium"
          style={{
            color: colors[name],
            borderColor: `color-mix(in srgb, ${colors[name]} 20%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${colors[name]} 10%, transparent)`,
          }}
        >
          {name}
        </li>
      ))}
    </ul>
  )
}
