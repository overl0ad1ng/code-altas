import { DefaultLayout } from "@code-altas/ui"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <DefaultLayout>{children}</DefaultLayout>
  )
}
