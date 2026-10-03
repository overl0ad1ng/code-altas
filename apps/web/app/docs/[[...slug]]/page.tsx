import { getDocMetadata } from "@code-altas/ui/server"
import type { Metadata } from "next"
import { DocsPage, type DocsPageProps } from "@code-altas/ui"
import { AsideComponent } from "./AsideComponent"
import { PreviewButton } from "../../../components/preview-button"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
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
