import React from "react"
import { ConfigProvider } from "../../lib/config-provider"
import { loadCodeAtlasConfig } from "../../server"
import { Header } from "../navigation/header"
import { ScrollArea } from "../../primitives/scroll-area"
import { Footer } from "../navigation/footer"

interface DefaultLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  /** Fill the remaining viewport for boards or other independently scrolling pages. */
  contentMode?: "scroll" | "fill"
}

async function DefaultLayout({
  children,
  contentMode = "scroll",
}: DefaultLayoutProps) {
  const config = await loadCodeAtlasConfig()

  return (
    <ConfigProvider config={config}>
      <div className="relative h-dvh overflow-hidden">
        <Header />
        {contentMode === "fill" ? (
          <div className="flex h-full min-h-0 flex-col pt-14">
            {children}
            <Footer />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="pt-14">{children}</div>
            <Footer />
          </ScrollArea>
        )}
      </div>
    </ConfigProvider>
  )
}

export { DefaultLayout, type DefaultLayoutProps }
