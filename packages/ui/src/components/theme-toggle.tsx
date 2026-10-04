"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { cn } from "cn"

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle({ className }: { className?: string } = {}) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
  const label = mounted
    ? resolvedTheme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme"
    : "Switch theme"

  return (
    <button
      disabled={!mounted}
      aria-label={label}
      title={label}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border transition-all duration-200 ease-out hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
        className
      )}
    >
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
    </button>
  )
}
