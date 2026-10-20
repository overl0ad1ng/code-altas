import type { MDXComponents } from "next-mdx-remote-client/rsc"
import type { ComponentPropsWithoutRef } from "react"

import { ConfigIcon } from "../../components/config-icon"
import {
  RoadmapView,
  type RoadmapViewVersion,
} from "../../components/roadmap-view"
import { loadCodeAtlasConfig } from "../../server/config"
import {
  loadRoadmapVersions,
  type RoadmapVersion,
} from "../../server/roadmap-content"
import { renderDoc } from "../../server/render-doc"
import { extractSearchDocument } from "../../server/search-extract"
import type { RoadmapDefinition } from "../../server/roadmap-schema"
import type { ConfigExperimental } from "../../interface/Config"

export interface RoadmapPageProps {
  components?: MDXComponents
}

function RoadmapInput(props: ComponentPropsWithoutRef<"input">) {
  const label =
    props["aria-label"] ??
    (props.type === "checkbox"
      ? props.checked
        ? "Completed task"
        : "Incomplete task"
      : undefined)
  return <input {...props} aria-label={label} />
}

function displayDefinition(definition: RoadmapDefinition) {
  return {
    id: definition.id,
    title: definition.title,
    icon: (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center"
        style={{ color: definition.color }}
      >
        {definition.icon ? (
          <ConfigIcon name={definition.icon} className="size-3.5" />
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
      </span>
    ),
  }
}

async function renderVersion(
  version: RoadmapVersion,
  components?: MDXComponents,
  experimental?: ConfigExperimental
): Promise<RoadmapViewVersion> {
  const items = await Promise.all(
    version.items.map(async ({ path, content, ...item }) => {
      try {
        const source = {
          ...item,
          content,
          extension: ".mdx" as const,
          slug: `/roadmap/${version.id}/${item.id}`,
        }
        const rendered = await renderDoc(
          source,
          { input: RoadmapInput, ...components },
          experimental
        )
        // Reuse the non-evaluating MDX text extractor; cards never contain nested controls.
        const extracted = extractSearchDocument(source)
        const preview = extracted.sections
          .map((section) =>
            [section.heading, section.text].filter(Boolean).join(" ")
          )
          .join(" ")
          .trim()
        return { ...item, preview, content: rendered.content }
      } catch (cause) {
        throw new Error(`Failed to render Roadmap item ${path}`, { cause })
      }
    })
  )
  return {
    id: version.id,
    version: version.version,
    title: version.title,
    goal: version.goal,
    groups: version.groups.map(displayDefinition),
    statuses: version.statuses.map(displayDefinition),
    items,
  }
}

/** Render content/_roadmap_ without requiring version entries in site config. */
export async function RoadmapPage({ components }: RoadmapPageProps = {}) {
  const versions = await loadRoadmapVersions()
  const config = versions.length
    ? await loadCodeAtlasConfig(process.cwd(), false)
    : undefined
  const rendered = await Promise.all(
    versions.map((version) =>
      renderVersion(version, components, config?.experimental)
    )
  )

  return <RoadmapView versions={rendered} />
}
