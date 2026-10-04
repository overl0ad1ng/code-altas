import type { ConfigDocsI18N, DocsMessages } from "../interface/Config"

const english: DocsMessages = {
  navSearchPlaceholder: "Search article titles…",
  navSearchClear: "Clear title search",
  search: "Search docs",
  searchPlaceholder: "Search documentation…",
  searchEmpty: "Search titles, headings, text and code.",
  searchLoading: "Searching…",
  searchNoResults: "No results found.",
  searchError: "Search is unavailable. Please try again.",
  searchRetry: "Retry",
  searchClose: "Close search",
  searchShortQuery:
    "Searching titles and headings. Type more to search full text.",
  language: "Language",
  previous: "Previous",
  next: "Next",
  onThisPage: "On this page",
  fallback:
    "This document is not available in your selected language. Showing {language}.",
}

const chinese: DocsMessages = {
  navSearchPlaceholder: "搜索文章标题…",
  navSearchClear: "清空标题搜索",
  search: "搜索文档",
  searchPlaceholder: "搜索文档…",
  searchEmpty: "搜索标题、小标题、正文和代码。",
  searchLoading: "正在搜索…",
  searchNoResults: "没有找到相关结果。",
  searchError: "搜索暂时不可用，请重试。",
  searchRetry: "重试",
  searchClose: "关闭搜索",
  searchShortQuery: "当前只搜索标题和小标题，继续输入可搜索全文。",
  language: "语言",
  previous: "上一页",
  next: "下一页",
  onThisPage: "本页目录",
  fallback: "当前文档暂无所选语言的版本，正在显示{language}。",
}

export function docsMessages(
  locale?: string,
  i18n?: ConfigDocsI18N
): DocsMessages {
  return {
    ...(locale?.toLowerCase().startsWith("zh") ? chinese : english),
    ...(locale ? i18n?.locales[locale]?.messages : undefined),
  }
}

/** Locale prefixes live inside /docs; document identity is language independent. */
export function parseDocsRoute(slug: string, i18n?: ConfigDocsI18N) {
  const segments = slug.split("/").filter(Boolean)
  const first = segments[0]
  const prefixed = !!i18n && !!first && Object.hasOwn(i18n.locales, first)
  return {
    locale: prefixed ? segments.shift()! : i18n?.defaultLocale,
    slug: `/${segments.join("/")}`,
    prefixed,
  }
}

export function localizedDocHref(
  slug: string,
  locale?: string,
  i18n?: ConfigDocsI18N
) {
  const prefix =
    i18n && locale && locale !== i18n.defaultLocale ? `/${locale}` : ""
  return `/docs${prefix}${slug === "/" ? "" : slug}`.replace(/\/+$/, "")
}

export function validateDocsI18n(i18n: ConfigDocsI18N) {
  if (!Object.hasOwn(i18n.locales, i18n.defaultLocale)) {
    throw new Error("docs.i18n.defaultLocale must be included in locales")
  }
  for (const [locale, value] of Object.entries(i18n.locales)) {
    if (
      !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(locale) ||
      !value.label?.trim()
    ) {
      throw new Error(`Invalid docs locale or label: ${locale}`)
    }
  }
}
