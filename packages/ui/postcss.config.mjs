import { existsSync } from "node:fs"
import { dirname, join } from "node:path"

function workspaceRoot() {
  const cwd = process.cwd()
  let directory = cwd
  while (!existsSync(join(directory, "pnpm-workspace.yaml"))) {
    const parent = dirname(directory)
    if (parent === directory) return cwd
    directory = parent
  }
  return directory
}

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // Scan apps and shared packages regardless of where the build is started.
      base: workspaceRoot(),
    },
  },
}

export default config
