export interface Config {
  title: string
  description: string
  /** Logo URL or path relative to the app's public directory. */
  logo: string
  /** Browser tab icon URL; defaults to logo. */
  icon?: string
  logoHref?: string

  docs?: ConfigDocs
  dark?: ConfigDark

  header?: ConfigHeader
  footer?: ConfigFooter
  experimental?: ConfigExperimental
}

export interface ConfigExperimental {
  /** Register experimental MDX components. Defaults to false. */
  experimentalComponentsInMDX?: boolean
}

export interface ConfigDark {
  logo?: string
}

export interface ConfigDocs {
  /** Enable document search after installing its API route and build step. */
  search?: false | { api?: string }
  categories?: ConfigDocsCategories
  /** Tag names mapped to CSS colors, referenced by document frontmatter. */
  tags?: Record<string, string>
  i18n?: ConfigDocsI18N
}

export interface ConfigDocsI18N {
  defaultLocale: string
  locales: Record<string, { label: string; messages?: Partial<DocsMessages> }>
}

export interface DocsMessages {
  search?: string
  searchPlaceholder?: string
  searchEmpty?: string
  searchLoading?: string
  searchNoResults?: string
  searchError?: string
  searchRetry?: string
  searchClose?: string
  searchShortQuery?: string
  language: string
  previous: string
  next: string
  onThisPage: string
  fallback: string
}

export interface ConfigFooter {
  author?: ConfigFooterAuthor
  copyright?: string
  license?: string
}

export interface ConfigFooterAuthor {
  name: string
  homepage?: string
}

export interface ConfigHeader {
  nav?: ConfigHeaderNav
  github: string | ConfigHeaderGithub
}

export interface ConfigHeaderGithub {
  url: string
  showStars?: boolean
}

export type ConfigDocsCategoryDocs = {
  name: string
  i18n?: {
    [lang: string]: string
  }
  slug?: string
  draft?: boolean
  disabled?: boolean
  icon?: string
  docs?: ConfigDocsCategoryDocs
}[]

export type ConfigDocsCategories = {
  /** Lucide name (lamp-icon, LampIcon, lucide:lamp) or Simple Icons name (simple:github, SiGithub). */
  icon: string
  name: string
  i18n?: Record<string, string>
  slug: string
  docs: ConfigDocsCategoryDocs
}[]

export type ConfigHeaderNav = {
  [path: string]: {
    label: string
    disabled?: boolean
  }
}
