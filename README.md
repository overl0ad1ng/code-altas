# Code Altas

Composable documentation and changelog components for Next.js. The web app is the documentation and product site; `packages/ui` is the publishable library.

See [the UI package README](packages/ui/README.md) for installation, beta compatibility and the release workflow.

## Adding components

To add internal primitives to the shared UI package, run the following command at the repository root:

```bash
pnpm dlx shadcn@latest add button -c packages/ui
```

This places primitives in `packages/ui/src/primitives`. Compose public components in
`packages/ui/src/ui`, then explicitly export them from `packages/ui/src/index.ts`.
The app's shadcn configuration generates app-local components in `apps/web/components/ui`.

## Using components

Import public components and types from the package root:

```tsx
import { Button, type ButtonProps } from "@code-altas/ui"
```

Workspace exports point to `src/index.ts` for development. `pnpm pack` and
`pnpm publish` override them with compiled JS and declarations in `dist`.
Only explicitly listed symbols are available from `@code-altas/ui`.
Internal primitives and `buttonVariants` are not exported from this entry point.
Use the root entry point for components, `/config` for configuration definitions,
and `/server` for the server-only configuration loader.

The entry point also imports global CSS, so importing `@code-altas/ui` loads the
shared styles. The app's PostCSS configuration references the shared configuration
directly; build configuration stays outside the component entry point.

## App configuration

Define the app configuration in `apps/web/codealtas.config.ts` with
`defineConfig` from `@code-altas/ui/config`. This entry does not import CSS or React.

`DefaultLayout` is a Server Component that automatically uses c12 to read
`codealtas.config.ts` from the current app directory. The app only needs to render
`<DefaultLayout>{children}</DefaultLayout>`; no loader call or provider setup is
required. `Config` and `defineConfig` provide TypeScript checks without a separate
runtime schema. For custom server layouts, the loader remains available as
`loadCodeAtlasConfig` from `@code-altas/ui/server`; pass an app directory explicitly
when calling it from another working directory.

`DefaultLayout` passes the result to `ConfigProvider`. Client components under it,
including components in `packages/ui`, can read the configuration:

```tsx
"use client"

import { useConfig } from "@code-altas/ui"

export function SiteTitle() {
  const { title } = useConfig()
  return <span>{title}</span>
}
```

Inside `packages/ui/src`, import `useConfig` from the relative path to
`lib/ConfigProvider`. Server components can call `loadCodeAtlasConfig()` or
receive configuration through props. Keep the `/server` entry in server code.

## Document content

All document sources live in `apps/web/content`. The configured category and
document slugs form the file path; `index` is omitted from public slugs only:

| Config path          | Document slug | Content file                  |
| -------------------- | ------------- | ----------------------------- |
| `index → index`      | `/`           | `content/index/index.mdx`     |
| `index → quickstart` | `/quickstart` | `content/index/quickstart.md` |
| `api → index`        | `/api/`       | `content/api/index.mdx`       |

Use the server entry to build the configured index and read a document:

```ts
import {
  flattenDocs,
  loadCodeAtlasConfig,
  loadDocsIndex,
  readDoc,
} from "@code-altas/ui/server"

const entries = await loadDocsIndex()
const slugs = entries.map((entry) => entry.slug)
const homepage = await readDoc("/")
// homepage.content is the original UTF-8 MD/MDX text, including frontmatter/JSX.

// Pure indexing is also available when the config is already loaded:
const config = await loadCodeAtlasConfig()
const index = flattenDocs(config.docs?.categories ?? [])
```

Each entry contains `slug`, `title`, `categorySlug`, `contentPath` (without an
extension), `draft`, and `disabled`. Group flags are inherited by descendants;
all configured leaves stay readable. Unconfigured files do not enter the index.
Indexing does not require the source files to exist. Reading throws descriptive
errors for unknown slugs, missing files, conflicting `.md`/`.mdx` sources, or
paths outside the content directory. `/api` and `/api/` resolve to the same entry.

The default working directory is the app directory. Scripts launched elsewhere
can pass it explicitly: `readDoc("/", "apps/web")` or `loadDocsIndex("apps/web")`.
No persistent content cache is used. `/docs` and all nested document routes read
the configured source on request and render Markdown or MDX on the server.
Navigation omits `index` from URLs; missing documents return 404.
The content enters with a fade and upward movement on document navigation,
while the shared layout remains mounted. Reduced-motion preferences disable it.

Use the server component `DocsPage` in an optional catch-all route. It accepts
Next.js's `params` promise and handles reading, MD/MDX rendering, and missing
documents:

```tsx
import { DocsPage, type DocsPageProps } from "@code-altas/ui"

export const dynamic = "force-dynamic"

export default function Page({ params }: DocsPageProps) {
  return <DocsPage params={params} />
}
```

Keep the route's `dynamic` export and the docs transition template in the app.

`DocsPage` displays a nonempty string `frontmatter.title` above the content,
falling back to the document name in the config. Frontmatter is removed from the
body; headings written in the body are preserved. Both formats support GFM
(tables, task lists, strikethrough, and autolinks). `.md` uses Markdown syntax;
`.mdx` additionally supports JSX and expressions in project-maintained content.

Default components provide basic typography, scrolling code blocks/tables, and
`Button`. Add or override components from your server page:

```tsx
import { DocsPage, type DocsPageProps } from "@code-altas/ui"
import { Callout } from "@/components/callout"

export default function Page({ params }: DocsPageProps) {
  return <DocsPage params={params} components={{ Callout }} />
}
```

`defaultDocsComponents` and the `MDXComponents` type are also exported from
`@code-altas/ui`. User components override matching default names. Interactive
components can use `"use client"`; import them in the server page and register
them through `components`. Component mappings belong in TSX, outside the config
provider. Imports and exports inside MDX are stripped; register components
explicitly. Invalid MDX and unregistered components throw errors rather than 404.
Syntax highlighting and additional document widgets are deferred.

`DocsPage` includes Previous/Next navigation after the content. Links follow the
configured document order across categories, use configured document names, and
skip draft/disabled entries. Unavailable directions are omitted. To obtain the
same links for a custom layout:

```ts
import { getDocPagination } from "@code-altas/ui"
import { loadDocsIndex } from "@code-altas/ui/server"

const { previous, next } = getDocPagination(
  await loadDocsIndex(),
  "/quickstart"
)
// Each link is { href, name }, or null at the boundary.
```

`DocsPagination` is exported for rendering those links separately.

Run the content checks with `pnpm --filter @code-altas/ui test:content`.
Run the rendering checks with `pnpm --filter @code-altas/ui test:render`.
