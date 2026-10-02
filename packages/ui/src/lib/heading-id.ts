import { slug } from "github-slugger"

/** Keep generated anchors unique, including IDs reserved by explicit headings. */
export function createHeadingId(title: string, used: Set<string>) {
  const base = slug(title) || "section"
  let id = base
  let suffix = 0
  while (used.has(id)) id = `${base}-${++suffix}`
  used.add(id)
  return id
}
