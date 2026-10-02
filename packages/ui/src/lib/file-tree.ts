export interface FileTreeNode {
  name: string
  path: string
  type: "file" | "directory"
  children: FileTreeNode[]
}

/** Merge shared path segments while preserving the input order at each level. */
export function parseFileTree(files: readonly string[]): FileTreeNode[] {
  const roots: FileTreeNode[] = []
  const nodes = new Map<string, FileTreeNode>()

  for (const file of files) {
    const normalized = file.replace(/\\/g, "/")
    const segments = normalized
      .split("/")
      .filter((part) => part && part !== ".")
    if (!segments.length) continue
    if (segments.includes("..")) {
      throw new Error(`FileTree paths cannot contain "..": ${file}`)
    }

    let siblings = roots
    let path = ""
    for (const [index, name] of segments.entries()) {
      path = path ? `${path}/${name}` : name
      const type =
        index < segments.length - 1 || normalized.endsWith("/")
          ? "directory"
          : "file"
      let node = nodes.get(path)
      if (node && node.type !== type) {
        throw new Error(`FileTree path is both a file and a directory: ${path}`)
      }
      if (!node) {
        node = { name, path, type, children: [] }
        nodes.set(path, node)
        siblings.push(node)
      }
      siblings = node.children
    }
  }

  return roots
}
