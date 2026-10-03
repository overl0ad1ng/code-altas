import { cn } from "cn"
import Link from "next/link"
import type { MDXComponents } from "next-mdx-remote-client/rsc"
import type { ComponentPropsWithoutRef } from "react"

import { Tabs, Tab } from "./components/tabs"
import { Steps, Step } from "./components/steps"
import { CodeBlock } from "./components/code-block"
import { MermaidView } from "./components/mermaid-view"
import { CodeGroup } from "./components/code-group"
import { CodeDiff } from "./components/code-diff"
import { PackageInstall } from "./components/package-install"
import { Hint, HintTitle, HintContent } from "./components/hint"
import { FileTree } from "./components/file-tree"
import { Surface } from "./components/surface"
import { Props, Prop } from "./components/props"
import { Changelogs, Changelog } from "./components/changelog"
import { Status } from "./components/status"

import type { ConfigExperimental, ConfigDocsI18N } from "../../interface/Config"
import { localizedDocHref, parseDocsRoute } from "../../lib/docs-i18n"
import { Preview, PreviewCode } from "./components/preview"

export function getDocsComponents(
  experimental?: ConfigExperimental,
  localization?: { locale?: string; i18n?: ConfigDocsI18N }
): MDXComponents {
  return {
    ...defaultDocsComponents,
    ...(localization?.i18n
      ? {
          a: (props: ComponentPropsWithoutRef<"a">) => {
            let href = props.href
            if (href && /^\/docs(?=\/|[?#]|$)/.test(href)) {
              const [, path, suffix = ""] = href.match(/^([^?#]*)(.*)$/)!
              const route = parseDocsRoute(path!.slice(5), localization.i18n)
              if (!route.prefixed)
                href =
                  localizedDocHref(
                    route.slug,
                    localization.locale,
                    localization.i18n
                  ) + suffix
            }
            return <DocsLink {...props} href={href} />
          },
        }
      : {}),
    ...(experimental?.experimentalComponentsInMDX
      ? { Preview, __CodeAltasPreviewCode: PreviewCode }
      : {}),
  }
}

function DocsLink({
  href,
  className,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const styles = cn("text-primary underline underline-offset-4", className)
  return href?.startsWith("/") && !href.startsWith("//") ? (
    <Link href={href} className={styles} {...props} />
  ) : (
    <a href={href} className={styles} {...props} />
  )
}

export const defaultDocsComponents: MDXComponents = {
  MermaidView,
  Changelogs,
  Changelog,
  Status,
  Steps,
  Step,
  Surface,
  Props,
  Prop,
  Tabs,
  Tab,
  CodeGroup,
  CodeDiff,
  PackageInstall,
  Hint,
  HintTitle,
  HintContent,
  FileTree,
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-10 mb-6 text-5xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-12 mb-4 pb-2 text-3xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-8 mb-3 text-xl font-semibold", className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("mt-6 mb-3 text-lg font-semibold", className)}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5 className={cn("mt-6 mb-2 font-semibold", className)} {...props} />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn("mt-6 mb-2 font-semibold text-muted-foreground", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("my-4 leading-7", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-4 list-disc space-y-2 pl-6 [&.contains-task-list]:list-none",
        className
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-4 list-decimal space-y-2 pl-6", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-7 [&>p]:my-2", className)} {...props} />
  ),
  a: DocsLink,
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-6 border-l-4 border-border pl-4 text-muted-foreground",
        className
      )}
      {...props}
    />
  ),
  img: ({ className, alt, ...props }) => (
    <img
      alt={alt ?? ""}
      className={cn("my-6 h-auto max-w-full rounded-lg", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-8 border-border", className)} {...props} />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-sm",
        className
      )}
      {...props}
    />
  ),
  pre: CodeBlock,
  table: ({ className, ...props }) => (
    <div className="my-6 max-w-full overflow-x-auto rounded-lg border border-border">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("bg-muted", className)} {...props} />
  ),
  tbody: ({ className, ...props }) => (
    <tbody className={cn("[&>tr:last-child]:border-0", className)} {...props} />
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn("border-b border-border", className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "px-4 py-3 font-semibold [&:not([align])]:text-left",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("px-4 py-3", className)} {...props} />
  ),
}
