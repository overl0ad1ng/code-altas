import { DefaultLayout } from "@code-altas/ui"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DefaultLayout contentMode="fill">{children}</DefaultLayout>
}
