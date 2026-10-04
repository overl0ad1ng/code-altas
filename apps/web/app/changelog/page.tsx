import { ChangelogPage } from "@code-altas/ui"
import { ProjectOverview } from "../../components/project-overview"

export const metadata = { title: "Changelog" }

export default function Page() {
  return <ChangelogPage components={{ ProjectOverview }} />
}
