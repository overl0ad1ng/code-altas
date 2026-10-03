import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

/** Shared token and line layout without code-block chrome. */
export function formatCodeLines(children: ReactNode) {
  return Children.map(children, (child) => {
    if (!isValidElement<ComponentPropsWithoutRef<"code">>(child)) return child
    return cloneElement(child, {
      style: {
        ...child.props.style,
        display: "block",
        whiteSpace: "normal",
        lineHeight: "inherit",
      },
      children: Children.map(child.props.children, (line) => {
        if (
          !isValidElement<ComponentPropsWithoutRef<"span">>(line) ||
          !line.props.className?.split(/\s+/).includes("line")
        )
          return line
        return cloneElement(line, {
          style: {
            ...line.props.style,
            display: "grid",
            width: "100%",
            minHeight: "1lh",
            lineHeight: "inherit",
            gridTemplateColumns: "calc(3ch + 1.5rem) minmax(0, 1fr)",
            alignItems: "start",
          },
          children: (
            <span
              style={{
                display: "block",
                minWidth: 0,
                minHeight: "1lh",
                lineHeight: "inherit",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {line.props.children}
            </span>
          ),
        })
      }),
    })
  })
}
