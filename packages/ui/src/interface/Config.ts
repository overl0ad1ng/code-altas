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
}

export interface ConfigDark {
  logo?: string
}

export interface ConfigDocs {
  categories?: ConfigDocsCategories
  /** Tag names mapped to CSS colors, referenced by document frontmatter. */
  tags?: Record<string, string>
  // i18n?: ConfigDocsI18N
}

export interface ConfigDocsI18N {
  label: string
  /**
   * 例如 zh、en，我们会将 `XXX.zh.mdx` / `XXX.en.mdx` 设置成对应的 i18n 翻译
   */
  extension: string
  /**
   * 和 extension 一样
   */
  defaultLang: string
}

export interface ConfigFooter {
  author?: ConfigFooterAuthor
  copyright?: string
  license?: string
}

export interface ConfigFooterAuthor {
  name: string,
  homepage?: string
}

export interface ConfigHeader {
  nav?: ConfigHeaderNav,
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
  slug: string
  docs: ConfigDocsCategoryDocs
}[]

export type ConfigHeaderNav = {
  [path: string]: {
    label: string
    disabled?: boolean
  }
};
