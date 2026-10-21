"use client"

import { useState } from "react"
import { GitBranch } from "lucide-react"
import { ScrollArea } from "../primitives/scroll-area"
import { SelectControl } from "./select-control"
import {
  RoadmapCard,
  type RoadmapCardItem,
  type RoadmapDisplayDefinition,
} from "./roadmap-card"

export interface RoadmapViewVersion {
  id: string
  version: string
  title: string
  goal?: string
  groups: RoadmapDisplayDefinition[]
  statuses: RoadmapDisplayDefinition[]
  items: RoadmapCardItem[]
}

/** MDX and configured icons arrive as server-rendered slots. */
export function RoadmapView({ versions }: { versions: RoadmapViewVersion[] }) {
  const [selectedId, setSelectedId] = useState(versions[0]?.id)
  const selected =
    versions.find((version) => version.id === selectedId) ?? versions[0]

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden text-foreground">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-5 sm:px-8 sm:py-6">
        <div className="min-w-0 flex-1 basis-48 space-y-2 wrap-anywhere">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              {selected?.title ?? "Roadmap"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selected && selected.version}
            </p>
          </div>
          {selected?.goal && (
            <p className="max-w-3xl text-sm text-muted-foreground">
              {selected.goal}
            </p>
          )}
        </div>
        {selected && (
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm text-muted-foreground">Version</span>
            <SelectControl
              label="Version"
              value={selected.id}
              items={versions.map((version) => ({
                value: version.id,
                label: version.version,
              }))}
              onValueChange={setSelectedId}
              icon={
                <GitBranch
                  aria-hidden="true"
                  className="size-3 text-muted-foreground"
                />
              }
            />
          </div>
        )}
      </div>
      {selected ? (
        <div key={selected.id} className="flex min-h-0 flex-1 flex-col">
          <div
            role="region"
            aria-label="Roadmap board"
            tabIndex={0}
            data-slot="roadmap-board"
            className="flex min-h-0 flex-1 overflow-x-auto overscroll-x-contain px-4 py-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-8"
          >
            <div className="mx-auto flex h-full shrink-0 gap-5">
              {selected.groups.map((group) => {
                const items = selected.items.filter(
                  (item) => item.group === group.id
                ).reverse()

                return (
                  <section
                    key={group.id}
                    aria-labelledby={`${selected.id}-${group.id}`}
                    data-slot="roadmap-column"
                    className="flex h-full min-h-0 w-87.5 max-w-[calc(100vw-2rem)] shrink-0 flex-col bg-foreground/5 p-1.5 rounded-xl"
                  >
                    <h2
                      id={`${selected.id}-${group.id}`}
                      className="mb-1.5 px-1.5 pt-1.5 flex shrink-0 items-center w-full justify-between text-sm font-medium wrap-anywhere"
                    >
                      <span className="flex items-center gap-2.5">
                        {group.icon}
                        {group.title}
                      </span>
                      <span className="text-xs text-muted-foreground pr-1">
                        {items.length}
                      </span>
                    </h2>
                    <ScrollArea className="min-h-0 flex-1">
                      <div className="space-y-1.5 pr-1 pb-1">
                        {items.length === 0 && (
                          <p className="rounded-lg pt-10 text-sm text-center text-muted-foreground">
                            Nothing
                          </p>
                        )}
                        {items.map((item) => (
                          <RoadmapCard
                            key={item.id}
                            item={item}
                            group={group}
                            status={selected.statuses.find(
                              (status) => status.id === item.status
                            )!}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </section>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="m-6 rounded-lg border border-dashed border-border p-6 text-muted-foreground">
          No roadmap versions have been configured yet.
        </p>
      )}
    </main>
  )
}
