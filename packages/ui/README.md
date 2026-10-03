# Code Altas UI

Composable documentation and changelog components for Next.js App Router. Keep
your routes, layouts and deployment; add MDX pages where you need them.

## Install the beta

Requires Node.js 22.12+, Next.js 16.3.6+ (16.x), and React / React DOM 19.2.8+ (19.x).

```sh
pnpm add @code-altas/ui@beta
```

The package ships ESM JavaScript, TypeScript declarations and compiled CSS.
Importing components from `@code-altas/ui` also loads the global stylesheet,
including a CSS reset and light/dark theme variables. Tailwind is not required
to style the package. For explicit stylesheet loading, use
`import "@code-altas/ui/styles.css"` in your root layout.

Documentation supports Mermaid fences (`mermaid`, with optional `title="..."`)
and KaTeX mathematics (`$...$` inline or `$$` delimiters on separate lines for
display formulas). Mermaid diagrams use the native default theme on a light
canvas and include a source copy button; they also work in `CodeGroup`.
KaTeX renders on the server, and the stylesheet includes its local font assets.

## Configure your app

Create `codealtas.config.ts` beside your app's `package.json`:

```ts
import { defineConfig } from "@code-altas/ui/config"

export default defineConfig({
  title: "My docs",
  description: "Documentation for my project",
  logo: "/logo.svg",
  docs: {
    categories: [
      {
        name: "Docs",
        icon: "lucide:book-open",
        slug: "docs",
        docs: [{ name: "Introduction", slug: "index" }],
      },
    ],
  },
})
```

Use these server dependencies as externals in `next.config.ts`:

```ts
import type { NextConfig } from "next"

export default {
  serverExternalPackages: ["c12", "jiti"],
} satisfies NextConfig
```

Add the site layout in `app/layout.tsx`:

```tsx
import "@code-altas/ui/styles.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

Add `app/docs/layout.tsx`:

```tsx
import { DocsLayout } from "@code-altas/ui"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsLayout>{children}</DocsLayout>
}
```

Add `app/docs/[[...slug]]/page.tsx`:

```tsx
import { DocsPage, type DocsPageProps } from "@code-altas/ui"

export const dynamic = "force-dynamic"

export default async function Page({ params }: DocsPageProps) {
  const { slug = [] } = await params
  return <DocsPage params={Promise.resolve({ slug: ["docs", ...slug] })} />
}
```

Visit `/docs`. Write your introduction at `content/docs/index.mdx`. Nested navigation slugs map
to nested folders. The final `index` segment is omitted from the URL.

```mdx
---
title: Introduction
description: Start here.
---

# Welcome

Your documentation starts here.
```

To add a changelog, render `ChangelogPage` from a server route and create
`content/changelog.mdx`. `Changelogs` and `Changelog` are registered MDX components;
tag colors come from `docs.tags` in the site configuration.

The root export contains server components as well as client components. Keep
pages and layouts on the server. Use `/config` when loading configuration outside
React, and `/server` only in server code. MDX can execute JavaScript: render
content you trust. Deploy with a Node.js runtime and include your `content/`
directory and configuration file; filesystem-based loading does not support Edge.

## Beta status

Version `0.1.0-beta` is an early release. Public APIs and styling may change
between prereleases. Pin the exact version for reproducible deployments and
report issues with a small reproduction.

## Maintainer release workflow

This repository uses pnpm. Workspace exports point at source for live development;
pnpm's `publishConfig` switches the packed exports to `dist`. **Use pnpm to pack
and publish this source repository**; npm does not apply those export overrides.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @code-altas/ui typecheck
pnpm --filter @code-altas/ui test:content
pnpm --filter @code-altas/ui test:render
pnpm --filter @code-altas/ui test:file-tree
pnpm --filter @code-altas/ui test:release
```

`test:release` builds, packs and checks the actual tarball. The package uses the
MIT license, included in the tarball.
After reviewing the tarball and testing it in a separate Next.js app:

```sh
pnpm --filter @code-altas/ui publish --access public --tag beta
```

The beta tag identifies this prerelease. On the first publish, npm also created
`latest` and rejected its removal; both currently point at `0.1.0-beta`. Install
an explicit version or `@beta`, and check `npm dist-tag ls @code-altas/ui` after
each release. Publishing requires access to the `@code-altas` npm scope. No
publish command runs during build or verification.
