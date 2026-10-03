import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@code-altas/ui"],
  serverExternalPackages: ["c12", "jiti"],
  outputFileTracingIncludes: {
    "/api/search": ["./.codealtas/search/**/*.json", "./codealtas.config.ts"],
  },
}

export default nextConfig
