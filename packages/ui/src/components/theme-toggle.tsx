"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "../ui/button"

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
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
      className="size-8 flex items-center justify-center rounded-lg border border-border cursor-pointer hover:bg-accent transition-all duration-200 ease-out"
    >
      <Moon aria-hidden="true" className="size-4 dark:hidden" />
      <Sun aria-hidden="true" className="hidden size-4 dark:block" />
    </button>
  )
}
