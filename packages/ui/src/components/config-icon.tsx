import "server-only"

import * as simpleIcons from "@icons-pack/react-simple-icons"
import { CircleHelp, icons } from "lucide-react"
import type { ComponentType, SVGProps } from "react"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

function normalizeName(name: string) {
  return name.replace(/[-_\s]/g, "").toLowerCase()
}

const lucideRegistry = new Map<string, SvgIcon>(
  Object.entries(icons).map(([name, component]) => [
    normalizeName(name),
    component,
  ])
)

const simpleRegistry = new Map<string, SvgIcon>()
for (const [name, component] of Object.entries(simpleIcons)) {
  if (/^Si[A-Z0-9]/.test(name) && typeof component !== "string") {
    simpleRegistry.set(normalizeName(name.slice(2)), component)
  }
}

/** Resolve serializable config names on the server; only the SVG reaches the client. */
function ConfigIcon({ name, className }: { name: string; className?: string }) {
  const value = name.trim()
  const prefixed = /^(lucide|simple|simple-icons):(.+)$/i.exec(value)
  const library = prefixed?.[1]?.toLowerCase()
  const iconName = prefixed?.[2] ?? value
  const key = normalizeName(iconName.replace(/(?:-icon|Icon)$/, ""))

  let Icon: SvgIcon | undefined
  if (library === "simple" || library === "simple-icons") {
    Icon = simpleRegistry.get(key)
  } else if (library === "lucide") {
    Icon = lucideRegistry.get(key)
  } else if (/^Si[A-Z0-9]/.test(value)) {
    Icon = simpleRegistry.get(normalizeName(value.slice(2)))
  } else {
    Icon = lucideRegistry.get(key) ?? simpleRegistry.get(key)
  }

  const ResolvedIcon = Icon ?? CircleHelp
  return <ResolvedIcon aria-hidden="true" className={className} />
}

export { ConfigIcon }
