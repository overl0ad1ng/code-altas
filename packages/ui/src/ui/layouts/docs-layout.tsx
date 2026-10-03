import React from "react"
import { ConfigProvider } from "../../lib/config-provider"
import { loadCodeAtlasConfig } from "../../server"
import { Header } from "../navigation/header"
import { DocsNav } from "../navigation/docs-nav"
import { ScrollArea } from "../../primitives/scroll-area"
import { Footer } from "../navigation/footer"
import { LocalizedDocsNav } from "../../components/localized-docs-nav"

interface DocsLayoutProps {
  children: React.ReactNode
}

async function DocsLayout({ children }: DocsLayoutProps) {
  const config = await loadCodeAtlasConfig()

  return (
    <ConfigProvider config={config}>
      <div className="relative h-dvh overflow-hidden [--docs-nav-width:16rem]">
        <Header />
        <aside
          aria-label="Documentation Navigation"
          className="fixed inset-y-0 left-0 z-10 w-[var(--docs-nav-width)] pt-14"
        >
          <div className="h-full p-2">
            <LocalizedDocsNav
              variants={Object.fromEntries(
                (config.docs?.i18n
                  ? Object.keys(config.docs.i18n.locales)
                  : ["default"]
                ).map((locale) => [
                  locale,
                  <DocsNav
                    key={locale}
                    categories={config.docs?.categories}
                    locale={locale === "default" ? undefined : locale}
                    i18n={config.docs?.i18n}
                  />,
                ])
              )}
            />
          </div>
        </aside>
        <div className="absolute inset-y-0 right-0 left-[var(--docs-nav-width)] min-w-0">
          <ScrollArea className="h-full">
            <div className="flex min-h-full min-w-0 flex-col pt-14">
              <main className="min-w-0 flex-1">
                <div className="w-full py-8">{children}</div>
              </main>
              <div className="shrink-0">
                <Footer />
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </ConfigProvider>
  )
}

export { DocsLayout, type DocsLayoutProps }
