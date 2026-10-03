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
export {
  MermaidView,
  type MermaidViewProps,
} from "./ui/mdx/components/mermaid-view"
export { CodeDiff, type CodeDiffProps } from "./ui/mdx/components/code-diff"
export {
  PackageInstall,
  type PackageInstallProps,
  type PackageManager,
} from "./ui/mdx/components/package-install"
export {
  Hint,
  HintTitle,
  HintContent,
  type HintProps,
  type HintTitleProps,
  type HintContentProps,
  type HintType,
} from "./ui/mdx/components/hint"
export { Tags, type TagsProps } from "./ui/mdx/components/tags"
export {
  Status,
  type StatusProps,
  type StatusType,
} from "./ui/mdx/components/status"
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
export { Preview, type PreviewProps } from "./ui/mdx/components/preview"
export { defaultDocsComponents, getDocsComponents } from "./ui/mdx/components"
export type { MDXComponents } from "next-mdx-remote-client/rsc"

// -----------------------------------------------------------
// lib
// -----------------------------------------------------------

export type { Config } from "./interface/Config"
export { defineConfig } from "./lib/DefineConfig"
export { ConfigProvider, useConfig } from "./lib/config-provider"
export { parseDocsRoute, localizedDocHref, docsMessages } from "./lib/docs-i18n"
export type { ConfigDocsI18N, DocsMessages } from "./interface/Config"
export type {
  DocsSearchResult,
  DocsSearchResponse,
  SearchHighlight,
} from "./lib/docs-search"
