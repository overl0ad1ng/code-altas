import { Geist, Geist_Mono } from "next/font/google"
import { getSiteMetadata } from "@code-altas/ui/server"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`antialiased ${fontMono.variable} font-sans ${geist.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
