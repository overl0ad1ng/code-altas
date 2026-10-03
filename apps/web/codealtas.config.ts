import { defineConfig } from "@code-altas/ui/config"

export default defineConfig({
  title: "Code Atlas",
  description: "A modern framework for documentation",
  logo: "/logo-indev.png",

  dark: {
    logo: "/logo-indev-dark.png",
  },

  docs: {
    tags: {
      Beta: "#1447E6",
      "Version Released": "#8A0194",
    },
    categories: [
      {
        name: "Getting Started",
        icon: "lucide:lamp",
        slug: "index",
        docs: [
          {
            name: "Getting Started",
            docs: [
              {
                name: "Introduction",
                slug: "index",
              },
              {
                name: "Quick Start",
                slug: "quickstart",
              },
              {
                name: "Layout And Page",
                slug: "layout-and-page",
              },
            ],
          },
          {
            name: "Writting",
            slug: "writting",
            docs: [
              {
                name: "MD and MDX",
                slug: "md-and-mdx",
              },
              {
                name: "Frontmatter",
                slug: "frontmatter",
              },
            ],
          },
          {
            name: "Concepts",
            slug: "concepts",
            docs: [
              {
                name: "File System",
                slug: "filesystem",
              },
            ],
          },
        ],
      },
      {
        name: "Components",
        icon: "lucide:puzzle",
        slug: "components",
        docs: [
          {
            name: "Introduction",
            docs: [
              {
                name: "Introduction",
                slug: "index",
              },
              {
                name: "Customization",
                slug: "customization",
              },
            ],
          },
          {
            name: "Components",
            docs: [
              {
                name: "Tabs",
                slug: "tabs",
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
