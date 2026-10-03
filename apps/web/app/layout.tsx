import { Geist, Geist_Mono } from "next/font/google"
import { getSiteMetadata } from "@code-altas/ui/server"
import { headers } from "next/headers"
import siteConfig from "../codealtas.config"

export async function generateMetadata() {
  return getSiteMetadata()
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const localeHeader = (await headers()).get("x-codeatlas-locale")
  const locale =
    localeHeader &&
    siteConfig.docs?.i18n &&
    Object.hasOwn(siteConfig.docs.i18n.locales, localeHeader)
      ? localeHeader
      : (siteConfig.docs?.i18n?.defaultLocale ?? "en")
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`antialiased ${fontMono.variable} font-sans ${geist.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
