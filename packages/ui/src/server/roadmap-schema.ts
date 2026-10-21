import { parse as parseToml } from "smol-toml"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkFrontmatter from "remark-frontmatter"
import { parse as parseYaml } from "yaml"

function invalid(path: string, field: string, reason: string): never {
  throw new Error(`Invalid Roadmap ${path}: ${field} ${reason}`)
}

function record(value: unknown, path: string, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalid(path, field, "must be a table/object")
  }
  return value as Record<string, unknown>
}

function text(value: unknown, path: string, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    invalid(path, field, "must be a non-empty string")
  }
  return value.trim()
}

function optionalText(value: unknown, path: string, field: string) {
  return value === undefined ? undefined : text(value, path, field)
}

function definitions(value: unknown, path: string, field: string) {
  if (!Array.isArray(value) || value.length === 0) {
    invalid(path, field, "must contain at least one definition")
  }
  const ids = new Set<string>()
  return value.map((entry: unknown, index) => {
    const prefix = `${field}[${index}]`
    const data = record(entry, path, prefix)
    const id = text(data.id, path, `${prefix}.id`)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      invalid(
        path,
        `${prefix}.id`,
        "must use lowercase letters, digits and hyphens"
      )
    }
    if (ids.has(id)) invalid(path, `${prefix}.id`, `duplicates "${id}"`)
    ids.add(id)
    const color = optionalText(data.color, path, `${prefix}.color`)
    if (color && !/^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(color)) {
      invalid(path, `${prefix}.color`, "must be #RGB or #RRGGBB")
    }
    return {
      id,
      title: text(data.title, path, `${prefix}.title`),
      color,
      icon: optionalText(data.icon, path, `${prefix}.icon`),
    }
  })
}

export type RoadmapDefinition = ReturnType<typeof definitions>[number]

export function parseRoadmapConfig(
  source: string,
  path: string,
  version: string
) {
  let parsed: unknown
  try {
    parsed = parseToml(source)
  } catch (cause) {
    throw new Error(`Invalid Roadmap ${path}: TOML syntax`, { cause })
  }
  const data = record(parsed, path, "config")
  return {
    title: optionalText(data.title, path, "title") ?? version,
    goal: optionalText(data.goal, path, "goal"),
    groups: definitions(data.groups, path, "groups"),
    statuses: definitions(data.statuses, path, "statuses"),
  }
}

export type RoadmapConfig = ReturnType<typeof parseRoadmapConfig>

const frontmatterParser = unified().use(remarkParse).use(remarkFrontmatter)

function dueDate(value: unknown, path: string) {
  if (value === undefined) return undefined
  const due = text(value, path, "due")
  const date = new Date(`${due}T00:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(due) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== due
  ) {
    invalid(path, "due", "must be a real calendar date in YYYY-MM-DD format")
  }
  return due
}

function assignees(value: unknown, path: string): (string | number)[] {
  if (value === undefined) return []
  if (!Array.isArray(value))
    invalid(
      path,
      "assignees",
      "must be an array of GitHub usernames or numeric user IDs"
    )
  const users = value.map((entry: unknown, index) => {
    const field = `assignees[${index}]`
    if (typeof entry === "number") {
      if (!Number.isSafeInteger(entry) || entry <= 0)
        invalid(path, field, "must be a positive GitHub user ID")
      return entry
    }
    const username = text(entry, path, field)
    if (username.length > 39 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(username)) {
      invalid(path, field, "must be a GitHub username")
    }
    return username
  })
  return [...new Set(users)]
}

function properties(value: unknown, path: string) {
  if (value === undefined) return {}
  const data = record(value, path, "properties")
  return Object.fromEntries(
    Object.entries(data).map(([key, entry]) => {
      text(key, path, "properties key")
      if (
        typeof entry !== "string" &&
        typeof entry !== "boolean" &&
        !(typeof entry === "number" && Number.isFinite(entry))
      ) {
        invalid(
          path,
          `properties.${key}`,
          "must be a string, finite number or boolean"
        )
      }
      return [key, entry] as const
    })
  )
}

export function parseRoadmapItem(
  source: string,
  path: string,
  config: RoadmapConfig
) {
  let parsed: unknown
  try {
    const node = frontmatterParser
      .parse(source)
      .children.find((child) => child.type === "yaml")
    parsed = node && "value" in node ? parseYaml(String(node.value)) : {}
  } catch (cause) {
    throw new Error(`Invalid Roadmap ${path}: frontmatter syntax`, { cause })
  }

  const data = record(parsed, path, "frontmatter")
  const title = text(data.title, path, "title")
  const group = text(data.group, path, "group")
  const status = text(data.status, path, "status")

  if (!config.groups.some((definition) => definition.id === group)) {
    invalid(path, "group", `references unknown ID "${group}"`)
  }

  if (!config.statuses.some((definition) => definition.id === status)) {
    invalid(path, "status", `references unknown ID "${status}"`)
  }

  const order = data.order === undefined ? 0 : data.order

  if (typeof order !== "number" || !Number.isSafeInteger(order)) {
    invalid(path, "order", "must be a safe integer")
  }

  return {
    title,
    description: optionalText(data.description, path, "description"),
    group,
    status,
    order,
    release: optionalText(data.release, path, "release"),
    priority: optionalText(data.priority, path, "priority"),
    due: dueDate(data.due, path),
    assignees: assignees(data.assignees, path),
    properties: properties(data.properties, path),
  }
}

export type RoadmapItemMetadata = ReturnType<typeof parseRoadmapItem>
