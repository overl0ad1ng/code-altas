import { cn } from "cn"

import { CodeBlock } from "./code-block"
import { Tab, Tabs } from "./tabs"

const managers = [
  { name: "npm", command: "npm install", icon: "simple:npm" },
  { name: "pnpm", command: "pnpm install", icon: "simple:pnpm" },
  { name: "yarn", command: "yarn add", icon: "simple:yarn" },
  { name: "bun", command: "bun add", icon: "simple:bun" },
] as const

export type PackageManager = (typeof managers)[number]["name"]

export interface PackageInstallProps {
  package: string
  defaultManager?: PackageManager
  className?: string
}

export function PackageInstall({
  package: packageName,
  defaultManager = "npm",
  className,
}: PackageInstallProps) {
  const name = packageName.trim()
  if (!name) throw new Error("PackageInstall requires a non-empty package")

  return (
    <Tabs
      defaultIndex={managers.findIndex(
        (manager) => manager.name === defaultManager
      )}
      className={cn("[&>[role=tabpanel]>div]:my-0", className)}
    >
      {managers.map((manager) => (
        <Tab key={manager.name} name={manager.name} icon={manager.icon}>
          <CodeBlock data-title="Terminal">
            <code className="language-bash">
              <span className="line">{`${manager.command} ${name}`}</span>
            </code>
          </CodeBlock>
        </Tab>
      ))}
    </Tabs>
  )
}
