import React from "react"
import { ConfigProvider } from "../../lib/config-provider"
import { loadCodeAtlasConfig } from "../../server"
import { DocsNav } from "../navigation/docs-nav"
import { Footer } from "../navigation/footer"
import { LocalizedDocsNav } from "../../components/localized-docs-nav"
import { DocsNavigationShell } from "../../components/docs-navigation-shell"

interface DocsLayoutProps {
  children: React.ReactNode
}

async function DocsLayout({ children }: DocsLayoutProps) {
  const config = await loadCodeAtlasConfig()
  function navigation(mobile = false) {
    return (
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
              mobile={mobile}
            />,
          ])
        )}
      />
    )
  }

  return (
    <ConfigProvider config={config}>
      <DocsNavigationShell
        desktopNavigation={navigation()}
        mobileNavigation={navigation(true)}
        footer={<Footer />}
      >
        {children}
      </DocsNavigationShell>
    </ConfigProvider>
  )
}

export { DocsLayout, type DocsLayoutProps }
