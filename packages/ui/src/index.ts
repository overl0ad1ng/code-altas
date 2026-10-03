import "./styles/globals.css"

// -----------------------------------------------------------
// UI
// -----------------------------------------------------------

export { Button } from "./ui/button"
export type { ButtonProps } from "./ui/button"
export {
  Steps,
  Step,
  type StepsProps,
  type StepProps,
} from "./ui/mdx/components/steps"
export {
  Tabs,
  Tab,
  type TabsProps,
  type TabProps,
} from "./ui/mdx/components/tabs"
export { FileTree, type FileTreeProps } from "./ui/mdx/components/file-tree"
export { CodeGroup, type CodeGroupProps } from "./ui/mdx/components/code-group"
export { Tags, type TagsProps } from "./ui/mdx/components/tags"
export {
  Changelogs,
  Changelog,
  type ChangelogsProps,
  type ChangelogProps,
} from "./ui/mdx/components/changelog"
export {
  Props,
  Prop,
  type PropsProps,
  type PropProps,
} from "./ui/mdx/components/props"

// -----------------------------------------------------------
// Layout
// -----------------------------------------------------------

export { DefaultLayout } from "./ui/layouts/default-layout"
export type { DefaultLayoutProps } from "./ui/layouts/default-layout"
export { DocsLayout } from "./ui/layouts/docs-layout"
export type { DocsLayoutProps } from "./ui/layouts/docs-layout"

export { DocsPage, type DocsPageProps } from "./ui/pages/DocsPage"
export {
  ChangelogPage,
  type ChangelogPageProps,
} from "./ui/pages/ChangelogPage"
export { DocsPagination } from "./ui/navigation/docs-pagination"
export {
  getDocPagination,
  type DocPagination,
  type DocPageLink,
} from "./lib/docs-navigation"
export { defaultDocsComponents } from "./ui/mdx/components"
export type { MDXComponents } from "next-mdx-remote-client/rsc"

// -----------------------------------------------------------
// lib
// -----------------------------------------------------------

export type { Config } from "./interface/Config"
export { defineConfig } from "./lib/DefineConfig"
export { ConfigProvider, useConfig } from "./lib/config-provider"
