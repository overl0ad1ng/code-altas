import { cn } from "cn"
import {
  Children,
  Fragment,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"

import { CodeBlock } from "./code-block"
import { Tab, Tabs, type TabsProps } from "./tabs"

export type CodeGroupProps = TabsProps

const languageIcons: Record<string, string> = {
  ts: "simple:typescript",
  tsx: "simple:typescript",
  typescript: "simple:typescript",
  js: "simple:javascript",
  jsx: "simple:javascript",
  javascript: "simple:javascript",
  html: "simple:html5",
  css: "simple:css",
  scss: "simple:sass",
  sass: "simple:sass",
  less: "simple:less",
  json: "simple:json",
  jsonc: "simple:json",
  md: "simple:markdown",
  markdown: "simple:markdown",
  mdx: "simple:mdx",
  vue: "simple:vuedotjs",
  svelte: "simple:svelte",
  astro: "simple:astro",
  py: "simple:python",
  python: "simple:python",
  rs: "simple:rust",
  rust: "simple:rust",
  go: "simple:go",
  c: "simple:c",
  cpp: "simple:cplusplus",
  "c++": "simple:cplusplus",
  cs: "lucide:code",
  csharp: "lucide:code",
  java: "lucide:coffee",
  kotlin: "simple:kotlin",
  swift: "simple:swift",
  php: "simple:php",
  rb: "simple:ruby",
  ruby: "simple:ruby",
  dart: "simple:dart",
  sh: "lucide:terminal",
  shell: "lucide:terminal",
  bash: "simple:gnubash",
  zsh: "simple:zsh",
  powershell: "lucide:terminal",
  ps1: "lucide:terminal",
  yml: "simple:yaml",
  yaml: "simple:yaml",
  toml: "simple:toml",
  sql: "lucide:database",
  graphql: "simple:graphql",
  docker: "simple:docker",
  dockerfile: "simple:docker",
  text: "lucide:file-text",
  txt: "lucide:file-text",
}

/** Turn MDX fenced code blocks into tabs without changing their rendered content. */
export function CodeGroup({
  children,
  className,
  defaultIndex,
}: CodeGroupProps) {
  const tabs: ReactNode[] = []

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
      ) {
        throw new Error("CodeGroup only accepts fenced code blocks")
      }

      const code = Children.toArray(child.props.children).find((node) =>
        isValidElement(node)
      )
      const language = isValidElement<ComponentPropsWithoutRef<"code">>(code)
        ? code.props.className?.match(/(?:^|\s)language-([^\s]+)/)?.[1]
        : undefined
      const languageKey = language?.toLowerCase() ?? "text"
      const icon = Object.hasOwn(languageIcons, languageKey)
        ? languageIcons[languageKey]
        : "lucide:code"

      tabs.push(
        <Tab
          key={tabs.length}
          name={child.props["data-title"] || language || "text"}
          icon={icon}
        >
          {child.type === "pre" ? <CodeBlock {...child.props} /> : child}
        </Tab>
      )
    })
  }

  collect(children)

  return (
    <Tabs
      defaultIndex={defaultIndex}
      className={cn("[&>[role=tabpanel]>div]:my-0", className)}
    >
      {tabs}
    </Tabs>
  )
}
