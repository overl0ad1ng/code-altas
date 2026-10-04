# Code Altas UI

Documentation and changelog components for the Next.js App Router. Keep your
application routes and deployment, write Markdown or MDX in your project, and
register documents through configuration.

## Install

Requires Node.js 22.12+, Next.js 16.3.6+ (16.x), and React / React DOM 19.2.8+ (19.x).

```sh
pnpm add @code-altas/ui@beta
```

The published package contains ESM JavaScript, TypeScript declarations, and
compiled CSS. Importing `@code-altas/ui` also loads global styles, including a
CSS reset and theme variables. Tailwind is optional for your application UI.
You can explicitly import `@code-altas/ui/styles.css` in the root layout.

Paths below are relative to the Next.js app directory, beside its `package.json`.
For `src/app` projects, put route files under `src/app` while keeping configuration,
`content`, and build scripts at the app root.

## Configure the site

Create `codealtas.config.ts`:

```ts
import { defineConfig } from "@code-altas/ui/config"

export default defineConfig({
  title: "My docs",
  description: "Documentation for my project",
  logo: "/logo.svg",
  docs: {
    categories: [
      {
        name: "Guides",
        icon: "lucide:book-open",
        slug: "index",
        docs: [{ name: "Introduction", slug: "index" }],
      },
    ],
  },
})
```

Put your logo in `public/logo.svg`. Optional site fields include `icon`,
`logoHref`, `dark.logo`, `header.nav`, `header.github`, and `footer`. GitHub accepts
a repository URL or `{ url, showStars: false }`. A provided `header` requires
`github` in the current configuration type; omit `header` if you need neither
repository links nor top navigation.

Use the configuration loader dependencies as server externals in `next.config.ts`:

```ts
import type { NextConfig } from "next"

export default {
  serverExternalPackages: ["c12", "jiti"],
} satisfies NextConfig
```

Merge these fields with existing options. `transpilePackages` is needed for this
repository's workspace source package, not for the published compiled package.

## Add layouts and the document route

Create or update `app/layout.tsx`:

```tsx
import "@code-altas/ui/styles.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
```

Create `app/docs/layout.tsx`:

```tsx
import { DocsLayout } from "@code-altas/ui"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsLayout>{children}</DocsLayout>
}
```

Create `app/docs/[[...slug]]/page.tsx`:

```tsx
import { DocsPage, type DocsPageProps } from "@code-altas/ui"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default function Page({ params }: DocsPageProps) {
  return <DocsPage params={params} />
}
```

Write the introduction in `content/index/index.mdx`:

```md
---
title: Introduction
description: Start here.
---

## Welcome

Your documentation starts here.
```

Run `pnpm dev` and visit `/docs`. Do not also create `app/docs/page.tsx`, which
would conflict with the optional catch-all route. Built-in navigation targets
`/docs`; a route group such as `(site)` does not create that URL prefix.

`DocsLayout` loads configuration and supplies the header, navigation, footer,
and system-aware light/dark theme. Use `DefaultLayout` for routes such as a home
page or changelog. Do not nest the two layouts, which would duplicate headers.
Keep route pages and layouts as Server Components.

## Content and navigation

Content paths combine category, parent-group, and document slugs. Every `index`
segment remains in the file path and is omitted from the public URL:

| Configuration path | Content file | URL |
| --- | --- | --- |
| `index → index` | `content/index/index.mdx` | `/docs` |
| `index → quickstart` | `content/index/quickstart.mdx` | `/docs/quickstart` |
| `index → guides → install` | `content/index/guides/install.md` | `/docs/guides/install` |
| `components → index` | `content/components/index.mdx` | `/docs/components` |

Groups without a slug organize navigation without adding a directory. Register
each article in `docs.categories`; files are not discovered automatically. Keep
only one `.md` or `.mdx` file for each document and language. Duplicate public
slugs are rejected.

Array order controls navigation and previous/next links, including across
categories. `draft` and `disabled` exclude a document or subtree from navigation,
pagination, and search. They do not block direct URL reading of a configured
document and are not access-control mechanisms. Set them in configuration, not
frontmatter.

Frontmatter supports `title`, `description`, and string-array `tags`. A missing
title falls back to the configured name. Set tag colors in `docs.tags`; article
tags without a configured, nonempty color are omitted.

Markdown supports tables, task lists, and strikethrough. MDX adds registered JSX
components and expressions, but document `import` and `export` statements are
disabled. Import custom components in the route and pass a map through
`DocsPage.components`. Mark interactive component modules with `"use client"`,
while keeping the route on the server. Render project-owned, trusted MDX source.

Code fences support language identifiers, `title="file.ts"`, and highlighted
lines such as `{1,3-5}`, with line numbers and a copy button. Syntax colors use
GitHub light/dark themes. `mermaid` fences render diagrams with a light canvas
and source-copy control; `$...$` and `$$...$$` render KaTeX formulas. Neither
requires an experimental flag. Preview registration requires
`experimental.experimentalComponentsInMDX: true`.

## Languages

Configure `docs.i18n` with `defaultLocale` and `locales`:

```ts
i18n: {
  defaultLocale: "en",
  locales: {
    en: { label: "English" },
    "zh-CN": { label: "简体中文" },
  },
},
```

Keep the document entry registered once. Use language suffixes such as
`content/index/quickstart.en.mdx` and `quickstart.zh-CN.mdx`. Unsuffixed files
belong to the default language. Missing translations fall back to default
content; the page displays a notice. Translated navigation names use each
entry's `i18n` map. Fixed interface labels can be overridden through locale
`messages`.

Default-language URLs use `/docs/...`; other languages use `/docs/zh-CN/...`.
Internal article links without an explicit language follow the current locale.

## Metadata

Export `generateMetadata` from the root layout to return `getSiteMetadata()`
from `@code-altas/ui/server`. It supplies the site title template, description,
and icon (`icon`, falling back to `logo`).

For the document route, add:

```tsx
import { getDocMetadata } from "@code-altas/ui/server"

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug } = await params
  return getDocMetadata(`/${(slug ?? []).join("/")}`)
}
```

This uses article titles and descriptions and supplies a canonical path with
i18n. Set Next.js `metadataBase` to your production domain for relative metadata
URLs. Sitemaps, robots, and sharing images remain application responsibilities.
The helper compiles with the default component registry; articles requiring
custom components need matching application metadata logic.

## Document search

Add `search: {}` to `docs`, then create `app/api/search/route.ts`:

```ts
import { createDocsSearchHandler } from "@code-altas/ui/server"

export const runtime = "nodejs"
export const GET = createDocsSearchHandler()
```

The shared header shows the search entry on documentation and other pages.
Ctrl/Cmd+K opens the dialog wherever that header is rendered. Non-docs pages
search the default language. The sidebar input separately filters configuration
titles in the current category without API requests.

`docs.search.api` can replace `/api/search`; update the route and deployment
include together. Omit `docs.search` or use `false` to disable full-text search.

Create `scripts/build-search.mjs` for the published package:

```js
import { buildDocsSearchIndex } from "@code-altas/ui/search"

console.table(await buildDocsSearchIndex())
```

For workspace TypeScript source, install `jiti` as a dev dependency and use:

```js
import { createJiti } from "jiti"

const { buildDocsSearchIndex } = await createJiti(import.meta.url).import(
  "@code-altas/ui/search"
)
console.table(await buildDocsSearchIndex())
```

Set the build command to `node scripts/build-search.mjs && next build`.
The script prints per-language page counts and sizes and writes private indexes
to `.codealtas/search/`. `buildDocsSearchIndex({ cwd, outDir })` supports custom
output for tools; runtime still reads the default directory, so copy custom
output there before deployment. The `/search` entry needs neither React nor
`server-only`.

Development builds indexes in memory and checks source changes at most once per
second. Production caches prebuilt indexes; regenerate, rebuild, and redeploy
after content changes. Missing or incompatible indexes return 503.

Search indexes titles, headings, descriptions, prose, JSX child text, and code,
without executing MDX. Draft/disabled branches and translation fallbacks are
excluded. A single character searches titles/headings only. Multiple words must
all match the same page; titles/headings support prefixes, with no fuzzy or
arbitrary substring matching. Code identifiers are indexed whole and split at
camel case, underscores, hyphens, and dots.

`GET /api/search?q=...&locale=...` returns up to 20 matching results and snippets.
The locale defaults to the configured language. Unknown locales or queries over
100 Unicode characters return 400; empty/punctuation-only queries return an
empty results array. Responses use `Cache-Control: no-store`. Result and response
types are exported from the UI entry.

## Changelog

Render `ChangelogPage` from a server route with `DefaultLayout` and create
`content/changelog.mdx`. It does not belong in `docs.categories` and must use
the `.mdx` extension.

```mdx
---
title: Changelog
---

<Changelogs sortBy="date">
  <Changelog date="2026-10-02" title="First release" tags={["Released"]}>
    Our first release is available.
  </Changelog>
</Changelogs>
```

`date` sorting puts newer entries first; `index` preserves author order. Tag
colors come from `docs.tags`. A missing changelog file returns 404.

## Deploy

Use a Node.js service. The filesystem reader is not supported on Edge, and the
dynamic routes shown here do not work with a purely static export. Include
content, configuration, and optional search indexes in server output tracing:

```ts
outputFileTracingIncludes: {
  "/*": ["./content/**/*", "./codealtas.config.ts"],
  "/api/search": ["./.codealtas/search/**/*.json"],
},
```

Include local files imported by configuration and adapt custom endpoint paths.
Keep indexes outside `public`, ignore `.codealtas/` in Git, and include
`.codealtas/search/**` in build-cache outputs. Start from the app root because
default file loading uses `process.cwd()`. Verify with `pnpm build` and
`pnpm start` before deploying.

For Next.js standalone output, also copy `public` and `.next/static` to the
generated application directory and preserve included runtime files.

## Package entries

| Entry | Purpose |
| --- | --- |
| `@code-altas/ui` | Layouts, pages, MDX components, providers, helpers, and types; loads CSS. |
| `@code-altas/ui/config` | Configuration definition and route locale helpers without loading UI CSS. |
| `@code-altas/ui/server` | Server-only config/content readers, metadata helpers, and search handler. |
| `@code-altas/ui/search` | Index generation for build scripts. |
| `@code-altas/ui/styles.css` | Compiled global styles. |

Public APIs and styling may change between releases. Pin an exact package
version for reproducible deployments and report issues with a small reproduction.

## Maintainer verification and release

This repository uses pnpm. Workspace exports target source; `publishConfig`
switches packed exports to `dist`. Use pnpm to pack and publish the source
repository, because npm does not apply these export overrides.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @code-altas/ui typecheck
pnpm --filter @code-altas/ui test:content
pnpm --filter @code-altas/ui test:render
pnpm --filter @code-altas/ui test:search
pnpm --filter @code-altas/ui test:release
```

`test:release` builds, packs, and checks the actual tarball, including its MIT
license. `bench:search` measures real and synthetic search corpora, including
index sizes, memory, and query latency. These are repository maintainer commands.

After reviewing the tarball and testing it in a separate Next.js app:

```sh
pnpm --filter @code-altas/ui publish --access public --tag beta
```

Publishing requires access to the `@code-altas` npm scope. Verify registry
dist-tags after each release with `npm dist-tag ls @code-altas/ui`; do not assume
`latest` and `beta` point to the same version. Build and verification do not
publish the package.
