import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { notFound } from "next/navigation"
import type { MDXComponents } from "next-mdx-remote-client/rsc"

import { renderDoc } from "../../server/render-doc"

export interface ChangelogPageProps {
  components?: MDXComponents
}

/** Render the app's content/changelog.mdx without a docs navigation entry. */
export async function ChangelogPage({ components }: ChangelogPageProps = {}) {
  let content
  try {
    content = await readFile(
      join(process.cwd(), "content", "changelog.mdx"),
      "utf8"
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") notFound()
    throw error
  }

  const rendered = await renderDoc(
    { content, extension: ".mdx", slug: "/changelog", title: "Changelog" },
    components
  )

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 px-6 py-12 text-foreground sm:px-8">
      <h1 className="text-4xl font-semibold">
        {rendered.title}
      </h1>
      <article data-doc-body className="min-w-0 wrap-anywhere">
        {rendered.content}
      </article>
    </main>
  )
}
