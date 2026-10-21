import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"
import { withCodeAltas } from "@code-altas/ui/next"

const nextConfig: NextConfig = {
  transpilePackages: ["@code-altas/ui"],
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
}

export default withCodeAltas(nextConfig)
