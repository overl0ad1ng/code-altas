import assert from "node:assert/strict"
import test from "node:test"

import { withCodeAltas } from "../dist/next.js"

test("withCodeAltas adds runtime tracing and server externals", () => {
  const config = withCodeAltas({
    outputFileTracingIncludes: { "/api/search": ["./.codealtas/search/**/*.json"] },
  })
  assert.deepEqual(config.serverExternalPackages, ["c12", "jiti"])
  const includes = config.outputFileTracingIncludes["/*"]
  assert.ok(includes.includes("./content/**/*"))
  assert.ok(includes.includes("./codealtas.config.*"))
  assert.ok(includes.some((item) => item.includes("lib") && item.endsWith("/**/*")))
  assert.ok(includes.some((item) => item.endsWith("package.json")))
  assert.deepEqual(config.outputFileTracingIncludes["/api/search"], [
    "./.codealtas/search/**/*.json",
  ])
})

test("withCodeAltas keeps user includes and paths", () => {
  const config = withCodeAltas(
    { outputFileTracingIncludes: { "/*": ["./assets/**/*"] } },
    { contentDir: "docs-content", configFile: "site.config.ts" }
  )
  const includes = config.outputFileTracingIncludes["/*"]
  assert.ok(includes.includes("./assets/**/*"))
  assert.ok(includes.includes("./docs-content/**/*"))
  assert.ok(includes.includes("./site.config.ts"))
})
