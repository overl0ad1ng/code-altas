import { getDocMetadata } from "@code-altas/ui/server"
import { DocsPage, type DocsPageProps } from "@code-altas/ui"
import { AsideComponent } from "./AsideComponent"
import { PreviewButton } from "../../../components/preview-button"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: DocsPageProps) {
  const { slug } = await params
  return getDocMetadata(`/${(slug ?? []).join("/")}`)
}

export default function Page({ params }: DocsPageProps) {
  return (
    <DocsPage
      params={params}
      components={{ Button: PreviewButton }}
      aside={<AsideComponent />}
    />
  )
}
