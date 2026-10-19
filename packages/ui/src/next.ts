import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"

export interface CodeAtlasNextOptions {
  /** Configuration file, relative to the application root. */
  configFile?: string
  /** Content directory, relative to the application root. */
  contentDir?: string
  /** Extra globs to add to every server trace. */
  include?: string[]
}

const toPosix = (value: string) => value.split(path.sep).join("/")

function resolveConfigEntry() {
  try {
    return createRequire(import.meta.url).resolve("@code-altas/ui/config")
  } catch {
    // The workspace source tree exposes the `.ts` entry directly; the packed
    // package exposes `dist/lib/DefineConfig.js`.
    const base = fileURLToPath(new URL("./lib/DefineConfig", import.meta.url))
    for (const extension of [".js", ".ts"]) {
      if (existsSync(base + extension)) return base + extension
    }
    throw new Error(
      "Unable to resolve @code-altas/ui/config. Is @code-altas/ui installed?"
    )
  }
}

function runtimeIncludes() {
  const entry = resolveConfigEntry()
  const runtimeDirectory = path.basename(path.dirname(path.dirname(entry)))
  const linkedPackage = path.join(
    process.cwd(),
    "node_modules",
    "@code-altas",
    "ui"
  )
  // Prefer the package link inside the application. Keeping the link in the
  // trace lets Node resolve `@code-altas/ui/config` through pnpm's symlink
  // layout; pointing only at the real `.pnpm` files is not enough.
  if (existsSync(path.join(linkedPackage, "package.json"))) {
    return [
      path.join(linkedPackage, runtimeDirectory, "lib"),
      path.join(linkedPackage, "package.json"),
    ]
  }
  const configDir = path.dirname(entry)
  const packageRoot = path.resolve(configDir, "..", "..")
  return [configDir, path.join(packageRoot, "package.json")]
}

/**
 * Adds files that code-altas reads with `fs` at request time to Next.js server
 * traces. `codealtas.config.ts` is loaded by c12/jiti, so its imports are not
 * visible to Next.js static tracing.
 */
export function withCodeAltas(
  nextConfig: NextConfig = {},
  options: CodeAtlasNextOptions = {}
): NextConfig {
  const globalIncludes = [
    ...(nextConfig.outputFileTracingIncludes?.["/*"] ?? []),
    `./${options.contentDir ?? "content"}/**/*`,
    `./${options.configFile ?? "codealtas.config.*"}`,
    "./.codealtas/search/**/*.json",
    ...runtimeIncludes().map((file) => {
      const relative = toPosix(path.relative(process.cwd(), file))
      const glob = relative.startsWith(".") ? relative : `./${relative}`
      return glob.endsWith("package.json") ? glob : `${glob}/**/*`
    }),
    ...(options.include ?? []),
  ]
  return {
    ...nextConfig,
    serverExternalPackages: [
      ...new Set([
        ...(nextConfig.serverExternalPackages ?? []),
        "c12",
        "jiti",
      ]),
    ],
    outputFileTracingIncludes: {
      ...nextConfig.outputFileTracingIncludes,
      "/*": [...new Set(globalIncludes)],
    },
  }
}
