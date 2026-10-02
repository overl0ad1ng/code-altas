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
}

async function DefaultLayout({ children }: DefaultLayoutProps) {
  const config = await loadCodeAtlasConfig()

  return (
    <ConfigProvider config={config}>
      <div className="relative h-dvh overflow-hidden">
        <Header />
        <ScrollArea className="h-full">
          <div className="pt-14">{children}</div>
          <Footer />
        </ScrollArea>
      </div>
    </ConfigProvider>
  )
}

export { DefaultLayout, type DefaultLayoutProps }
