import { Children, Fragment, isValidElement, type ReactNode } from "react"

import { Surface } from "./surface"

export interface PropProps {
  property: string
  type: string
  defaultValue: ReactNode
  description: ReactNode
}

export interface PropsProps {
  name: string
  children: ReactNode
}

/** Declarative row data consumed by Props. */
export function Prop(_props: PropProps) {
  return null
}

export function Props({ name, children }: PropsProps) {
  const rows: PropProps[] = []
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
      if (!isValidElement<PropProps>(child) || child.type !== Prop) {
        throw new Error("Props only accepts Prop children")
      }
      rows.push(child.props)
    })
  }
  collect(children)

  return (
    <Surface name={`${name} Props`} description={`${rows.length} properties`}>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col className="w-1/4" />
            <col className="w-1/4" />
            <col className="w-1/4" />
            <col className="w-1/4" />
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              {["Property", "Type", "Default", "Description"].map((label) => (
                <th key={label} scope="col" className="px-4 py-3 text-sm font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-border last:border-0">
                <td className="px-4 py-3 align-top font-mono wrap-anywhere">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {row.property}
                  </code>
                </td>
                <td className="px-4 py-3 align-top font-mono wrap-anywhere">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {row.type}
                  </code>
                </td>
                <td className="px-4 py-3 align-top font-mono wrap-anywhere">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {row.defaultValue}
                  </code>
                </td>
                <td className="px-4 py-3 align-top wrap-anywhere">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  )
}
