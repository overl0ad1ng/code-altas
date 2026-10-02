"use client"

import { useConfig } from "../lib/config-provider"

export function ChangelogTags({ tags }: { tags: readonly string[] }) {
  const colors = useConfig().docs?.tags ?? {}

  return (
    <ul
      aria-label="Release tags"
      className="m-0 flex list-none flex-wrap gap-2 p-0"
    >
      {tags.map((tag) => {
        const color = Object.hasOwn(colors, tag)
          ? colors[tag]?.trim()
          : undefined
        return (
          <li
            key={tag}
            className="max-w-full rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium wrap-anywhere text-muted-foreground"
            style={
              color
                ? {
                    color,
                    borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                  }
                : undefined
            }
          >
            {tag}
          </li>
        )
      })}
    </ul>
  )
}
