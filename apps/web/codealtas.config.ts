import { defineConfig } from "@code-altas/ui/config"

export default defineConfig({
  title: "Code Altas",
  description: "A modern framework for documentation",
  logo: "/logo-indev.png",

  experimental: {
    experimentalComponentsInMDX: true,
  },

  dark: {
    logo: "/logo-indev-dark.png",
  },

  docs: {
    search: {},
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
      "Feature Milestone": "#2563EB",
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
                name: "Code Blocks",
                i18n: { "zh-CN": "代码块" },
                slug: "code-blocks",
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
            name: "Configuration and Organization",
            i18n: { "zh-CN": "配置与组织" },
            slug: "concepts",
            docs: [
              {
                name: "Site Configuration",
                i18n: { "zh-CN": "站点配置" },
                slug: "configuration",
              },
              {
                name: "Navigation",
                i18n: { "zh-CN": "导航配置" },
                slug: "navigation",
              },
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
              {
                name: "Search",
                i18n: { "zh-CN": "搜索配置" },
                slug: "search",
              },
              {
                name: "Styles and Themes",
                i18n: { "zh-CN": "样式与主题" },
                slug: "theme",
              },
              {
                name: "Page Metadata",
                i18n: { "zh-CN": "页面元数据" },
                slug: "metadata",
              },
            ],
          },
          {
            name: "Deployment and Maintenance",
            i18n: { "zh-CN": "部署与维护" },
            slug: "operations",
            docs: [
              {
                name: "Build and Deployment",
                i18n: { "zh-CN": "构建与部署" },
                slug: "deployment",
              },
              {
                name: "Troubleshooting",
                i18n: { "zh-CN": "常见问题" },
                slug: "troubleshooting",
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
                name: "Cards",
                slug: "cards",
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
                name: "FAQ",
                slug: "faq",
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
      {
        name: "Roadmap",
        i18n: { "zh-CN": "路线图" },
        icon: "lucide:map",
        slug: "roadmap",
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
                name: "Create a Board",
                i18n: { "zh-CN": "创建看板" },
                slug: "create-a-board",
              },
              {
                name: "Render the Board",
                i18n: { "zh-CN": "渲染看板" },
                slug: "render-the-board",
              },
            ],
          },
          {
            name: "Configuration and Conventions",
            i18n: { "zh-CN": "配置与约定" },
            docs: [
              {
                name: "Board Configuration",
                i18n: { "zh-CN": "看板配置" },
                slug: "configuration",
              },
              {
                name: "Items",
                i18n: { "zh-CN": "条目" },
                slug: "items",
              },
              {
                name: "Conventions",
                i18n: { "zh-CN": "相关约定" },
                slug: "conventions",
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
      "/roadmap": {
        label: "Roadmap",
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
