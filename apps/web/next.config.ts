import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@code-altas/ui"],
  serverExternalPackages: ["c12", "jiti"],
}

export default nextConfig
