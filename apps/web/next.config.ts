import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

const nextConfig: NextConfig = {
  transpilePackages: ["@code-altas/ui"],
  serverExternalPackages: ["c12", "jiti"],
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  outputFileTracingIncludes: {
    // The runtime config imports defineConfig from the workspace package.
    "/*": [
      "./codealtas.config.ts",
      "./node_modules/@code-altas/ui/package.json",
      "./node_modules/@code-altas/ui/src/lib/**/*.ts",
    ],
    "/api/search": ["./.codealtas/search/**/*.json"],
  },
}

export default nextConfig
