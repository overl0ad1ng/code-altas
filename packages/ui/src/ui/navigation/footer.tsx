"use client"

import { useConfig } from "../../lib/config-provider"

function Footer() {
  const { footer } = useConfig()

  return (
    <footer className="w-full border-t border-border bg-background/80 px-4 py-6 backdrop-blur-xs sm:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex w-full flex-col items-center gap-3 text-center md:flex-row md:justify-between md:gap-6 md:text-left">
          <div>
            {footer?.author && (
              <span className="flex flex-wrap items-baseline justify-center gap-1 text-sm text-muted-foreground md:justify-start">
                Made by
                <a
                  href={footer?.author.homepage}
                  className="cursor-pointer border-b border-neutral-200 duration-200 ease-out hover:border-neutral-600"
                >
                  {footer?.author.name}
                </a>
              </span>
            )}
          </div>
          <div>
            {footer?.copyright && (
              <span className="flex flex-wrap items-baseline justify-center gap-2 text-sm text-muted-foreground md:justify-end">
                {footer?.copyright}
                {footer?.license && (
                  <>
                    <span>·</span>
                    <span className="flex items-baseline gap-1">
                      Under
                      <a
                        href={footer?.license}
                        target="_blank"
                        className="cursor-pointer border-b border-neutral-200 duration-200 ease-out hover:border-neutral-600"
                      >
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
    </footer>
  )
}

export { Footer }
