import { createJiti } from "jiti"

// jiti also supports the workspace's source TypeScript package entry.
const { buildDocsSearchIndex } = await createJiti(import.meta.url).import(
  "@code-altas/ui/search"
)
console.table(await buildDocsSearchIndex())
