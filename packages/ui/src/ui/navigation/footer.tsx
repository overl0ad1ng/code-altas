"use client"

import { useConfig } from "../../lib/config-provider"

function Footer() {
  const { footer } = useConfig()

  return (
    <div className="py-8 w-full border-t border-border bg-background/80 px-8 backdrop-blur-xs">
      <div className="xl:w-5xl mx-auto">
        <div className="w-full flex items-center justify-between">
          <div>
            {footer?.author && (
              <span className="text-sm dark:text-neutral-400 text-neutral-600 flex items-baseline gap-1">
                Made by
                <a href={footer?.author.homepage} className="border-b border-neutral-200 cursor-pointer hover:border-neutral-600 duration-200 ease-out">
                  {footer?.author.name}
                </a>
              </span>
            )}
          </div>
          <div>
            {footer?.copyright && (
              <span className="text-sm dark:text-neutral-400 text-neutral-600 flex items-baseline gap-2">
                {footer?.copyright}
                {footer?.license && (
                  <>
                    <span>
                      ·
                    </span>
                    <span className="flex items-baseline gap-1">
                      Under
                      <a href={footer?.license} target="_blank" className="border-b border-neutral-200 cursor-pointer hover:border-neutral-600 duration-200 ease-out">
                        license
                      </a>
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Footer }
