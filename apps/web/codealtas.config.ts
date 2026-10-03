import { defineConfig } from "@code-altas/ui/config"

export default defineConfig({
  title: "Code Atlas",
  description: "A modern framework for documentation",
  logo: "/logo-indev.png",

  experimental: {
    experimentalComponentsInMDX: true,
  },

  dark: {
    logo: "/logo-indev-dark.png",
  },

  docs: {
    i18n: {
      defaultLocale: "en",
      locales: {
        en: { label: "English" },
        "zh-CN": { label: "简体中文" },
      },
    },
    tags: {
      Beta: "#1447E6",
      "Version Released": "#8A0194",
    },
    categories: [
      {
        name: "Getting Started",
        i18n: { "zh-CN": "开始使用" },
        icon: "lucide:lamp",
        slug: "index",
        docs: [
          {
            name: "Getting Started",
            i18n: { "zh-CN": "开始使用" },
            docs: [
              {
                name: "Introduction",
                i18n: { "zh-CN": "介绍" },
                slug: "index",
              },
              {
                name: "Quick Start",
                i18n: { "zh-CN": "快速开始" },
                slug: "quickstart",
              },
              {
                name: "Layout And Page",
                i18n: { "zh-CN": "布局与页面" },
                slug: "layout-and-page",
              },
            ],
          },
          {
            name: "Writting",
            i18n: { "zh-CN": "编写文档" },
            slug: "writting",
            docs: [
              {
                name: "MD and MDX",
                i18n: { "zh-CN": "MD 和 MDX" },
                slug: "md-and-mdx",
              },
              {
                name: "Frontmatter",
                i18n: { "zh-CN": "前言" },
                slug: "frontmatter",
              },
              {
                name: "Mermaid",
                slug: "mermaid",
              },
              {
                name: "KaTeX",
                slug: "katex",
              },
            ],
          },
          {
            name: "Concepts",
            i18n: { "zh-CN": "核心概念" },
            slug: "concepts",
            docs: [
              {
                name: "File System",
                i18n: { "zh-CN": "文件系统" },
                slug: "filesystem",
              },
              {
                name: "Internationalization",
                i18n: { "zh-CN": "国际化（i18n）" },
                slug: "i18n",
              },
            ],
          },
        ],
      },
      {
        name: "Components",
        i18n: { "zh-CN": "组件" },
        icon: "lucide:puzzle",
        slug: "components",
        docs: [
          {
            name: "Introduction",
            i18n: { "zh-CN": "开始" },
            docs: [
              {
                name: "Introduction",
                i18n: { "zh-CN": "介绍" },
                slug: "index",
              },
              {
                name: "Customization",
                i18n: { "zh-CN": "自定义组件" },
                slug: "customization",
              },
            ],
          },
          {
            name: "Components",
            i18n: { "zh-CN": "组件" },
            docs: [
              {
                name: "Tabs",
                slug: "tabs",
              },
              {
                name: "Preview",
                slug: "preview",
              },
              {
                name: "FileTree",
                slug: "file-tree",
              },
              {
                name: "Steps",
                slug: "steps",
              },
              {
                name: "Code Groups",
                slug: "code-groups",
              },
              {
                name: "Code Diff",
                slug: "code-diff",
              },
              {
                name: "Hint",
                slug: "hint",
              },
              {
                name: "Status",
                slug: "status",
              },
              {
                name: "Package Install",
                slug: "package-install",
              },
            ],
          },
        ],
      },
    ],
  },

  header: {
    nav: {
      "/docs": {
        label: "Docs",
      },
      "/changelog": {
        label: "Changelog",
      },
    },

    github: "https://github.com/overl0ad1ng/code-altas",
  },

  footer: {
    author: {
      name: "overl0ad1ng",
      homepage: "https://github.com/overl0ad1ng",
    },
    copyright: "© 2026 Code Altas",
    license: "https://github.com/overl0ad1ng/code-altas?tab=MIT-1-ov-file",
  },
})
