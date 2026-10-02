import { DocsLayout } from "@code-altas/ui"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <DocsLayout>{children}</DocsLayout>
  )
}
