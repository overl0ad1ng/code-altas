import { SiGithub, SiNpm } from "@icons-pack/react-simple-icons"
import { cn } from "cn"
import { ArrowUpRight, GitFork, Star } from "lucide-react"
import type { ReactNode } from "react"
import { getProjectOverview } from "../lib/project-overview"

export interface ProjectOverviewProps {
  repository: string
  packageName: string
  className?: string
}

const numbers = new Intl.NumberFormat("en-US")
const dates = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

const linkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
const headingClass = "flex flex-wrap items-center justify-between gap-3"
const titleClass = "m-0 flex items-center gap-2 text-lg leading-6 font-semibold"
const identityClass = "mt-1.5 mb-5 text-sm text-muted-foreground wrap-anywhere"
const metricsClass = "m-0 grid grid-cols-2 gap-4"
const subheadingClass = "mt-6 mb-2 text-xs font-medium text-muted-foreground"
const rowsClass = "m-0 list-none p-0"
const rowClass = "border-t border-border py-3 wrap-anywhere last:pb-0"
const rowTitleClass =
  "flex flex-wrap items-center justify-between gap-3 text-sm font-medium"
const detailClass =
  "mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground"
const messageClass = "mt-3 mb-0 text-sm text-muted-foreground"
const channelColors: Record<string, string> = {
  latest:
    "border-emerald-600/25 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
  beta: "border-amber-600/25 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
}

function ChannelBadge({
  name,
  prerelease = false,
}: {
  name: string
  prerelease?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-xs leading-4 font-medium",
        channelColors[prerelease ? "beta" : name] ??
          "border-border bg-muted text-muted-foreground"
      )}
    >
      {name}
    </span>
  )
}

function PublishedDate({ value }: { value: string | null }) {
  return value ? (
    <time dateTime={value}>{dates.format(new Date(value))}</time>
  ) : (
    <>Unknown</>
  )
}

function Metric({
  label,
  value,
}: {
  label: ReactNode
  value: number | null | undefined
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 mb-0 text-[1.75rem] leading-9 font-semibold wrap-anywhere tabular-nums">
        {value == null ? (
          <span className="text-sm font-normal text-muted-foreground">
            Unavailable
          </span>
        ) : (
          numbers.format(value)
        )}
      </dd>
    </div>
  )
}

export async function ProjectOverview({
  repository,
  packageName,
  className,
}: ProjectOverviewProps) {
  const data = await getProjectOverview(repository, packageName)
  const repoUrl = `https://github.com/${repository.split("/").map(encodeURIComponent).join("/")}`
  const npmUrl = `https://www.npmjs.com/package/${packageName.split("/").map(encodeURIComponent).join("/")}`

  return (
    <section
      aria-label="Project overview"
      className={cn(
        "mt-6 mb-2 grid min-w-0 grid-cols-1 overflow-hidden rounded-lg border border-border text-foreground md:grid-cols-2",
        className
      )}
    >
      <section aria-label="GitHub" className="min-w-0 p-5 sm:p-6">
        <div className={headingClass}>
          <h2 className={titleClass}>
            <SiGithub size={20} aria-hidden="true" className="shrink-0" />
            GitHub
          </h2>
          <a
            className={cn(
              linkClass,
              "inline-flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground"
            )}
            href={repoUrl}
          >
            View repository <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
        <p className={identityClass}>{repository}</p>
        <dl className={metricsClass}>
          <Metric
            label={
              <>
                <Star
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 fill-amber-100 text-amber-600 dark:fill-amber-400/15 dark:text-amber-400"
                />{" "}
                Stars
              </>
            }
            value={data.github?.stars}
          />
          <Metric
            label={
              <>
                <GitFork
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-blue-600 dark:text-blue-400"
                />{" "}
                Forks
              </>
            }
            value={data.github?.forks}
          />
        </dl>
        <h3 className={subheadingClass}>Recent releases</h3>
        {data.releases === null ? (
          <p className={messageClass}>Releases are temporarily unavailable.</p>
        ) : !data.releases.length ? (
          <p className={messageClass}>No releases yet.</p>
        ) : (
          <ul className={rowsClass}>
            {data.releases.map((release) => (
              <li key={release.url} className={rowClass}>
                <div className={rowTitleClass}>
                  <a className={linkClass} href={release.url}>
                    {release.name}
                  </a>
                  {release.prerelease && (
                    <ChannelBadge name="Pre-release" prerelease />
                  )}
                </div>
                <div className={detailClass}>
                  <span>{release.tag}</span>
                  <PublishedDate value={release.publishedAt} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section
        aria-label="npm"
        className="min-w-0 border-t border-border p-5 sm:p-6 md:border-t-0 md:border-l"
      >
        <div className={headingClass}>
          <h2 className={titleClass}>
            <SiNpm
              size={24}
              aria-hidden="true"
              className="shrink-0 text-red-600 dark:text-red-400"
            />{" "}
            npm
          </h2>
          <a
            className={cn(
              linkClass,
              "inline-flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground"
            )}
            href={npmUrl}
          >
            View package <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
        <p className={identityClass}>{packageName}</p>
        <dl className={metricsClass}>
          <Metric label="Downloads / 7 days" value={data.weeklyDownloads} />
          <Metric label="Downloads / 30 days" value={data.monthlyDownloads} />
        </dl>
        <h3 className={subheadingClass}>Release channels</h3>
        {data.tags === null ? (
          <p className={messageClass}>
            Package versions are temporarily unavailable.
          </p>
        ) : !data.tags.length ? (
          <p className={messageClass}>No release channels yet.</p>
        ) : (
          <ul className={rowsClass}>
            {data.tags.map((tag) => (
              <li key={tag.name} className={rowClass}>
                <div className={rowTitleClass}>
                  <ChannelBadge name={tag.name} />
                  <a
                    className={cn(linkClass, "font-mono")}
                    href={`${npmUrl}/v/${encodeURIComponent(tag.version)}`}
                  >
                    {tag.version}
                  </a>
                </div>
                <div className={detailClass}>
                  <span>Version published</span>
                  <PublishedDate value={tag.publishedAt} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
