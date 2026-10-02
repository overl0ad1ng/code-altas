import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  CodeXml,
  GitFork,
  Layers,
  Puzzle,
  Server,
  SlidersHorizontal,
} from "lucide-react"
import { FileTree, Step, Steps, Tab, Tabs } from "@code-altas/ui"
import homePreview from "../../public/home-page-1.png"

const primaryLink =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
const textLink =
  "inline-flex items-center gap-2 rounded-sm text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
const accentIcon = "size-5 shrink-0 text-orange-700 dark:text-orange-400"
const mdxExample = `# Make yourself at home

Your content. Your components.

<Tabs>
  <Tab name="Markdown">
    Write guides in plain Markdown.
  </Tab>
  <Tab name="React">
    Bring your own React components.
  </Tab>
</Tabs>`

export default function Page() {
  return (
    <main className="overflow-x-clip pb-16 text-foreground lg:pb-24">
      <section
        aria-labelledby="hero-title"
        className="mx-auto grid max-w-[1440px] items-stretch gap-10 px-6 pt-12 pb-10 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:pt-20 lg:pb-16"
      >
        <div className="flex min-w-0 items-center py-6 lg:col-span-5 lg:py-8">
          <div className="w-full max-w-lg">
            <p className="mb-6 text-sm font-medium text-muted-foreground">
              Code Atlas / Documentation framework
            </p>
            <h1
              id="hero-title"
              className="text-4xl leading-[1.08] font-semibold tracking-tight sm:text-6xl lg:text-5xl xl:text-6xl"
            >
              Documentation, built your way.
            </h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
              An open-source framework that fits your Next.js project. Host it
              yourself, compose your own pages, and keep control of your
              content.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/docs/quickstart" className={primaryLink}>
                Get started <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/docs/components"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <BookOpen aria-hidden="true" className="size-4" />
                Explore components
              </Link>
            </div>
          </div>
        </div>
        <div className="relative flex min-w-0 items-center pb-8 lg:col-span-7 lg:pb-0">
          <Image
            src={homePreview}
            alt="Code Atlas documentation showing navigation, a quick start guide, and code examples"
            sizes="(min-width: 1440px) 756px, (min-width: 1024px) 55vw, (min-width: 640px) calc(100vw - 4rem), calc(100vw - 3rem)"
            preload
            className="h-auto w-full rounded-3xl"
          />
          <Link
            href="/docs/quickstart"
            className="absolute right-4 bottom-0 flex max-w-[calc(100%-2rem)] items-center gap-6 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:right-6 sm:p-5 lg:right-auto lg:bottom-5 lg:-left-6"
          >
            <div>
              <span className="block text-sm font-semibold">Quick Start</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Set up your first documentation pages
              </span>
            </div>
            <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
          </Link>
        </div>
      </section>

      <nav
        aria-label="Explore Code Atlas"
        className="mx-auto grid max-w-7xl grid-cols-2 border-y border-border px-6 sm:grid-cols-4 sm:px-8 lg:px-10"
      >
        {[
          { label: "Own your docs", href: "#ownership", icon: Server },
          { label: "Explore features", href: "#features", icon: Layers },
          { label: "See it in action", href: "#example", icon: Braces },
          { label: "Start building", href: "#start", icon: ArrowRight },
        ].map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 py-5 text-sm font-medium transition-colors hover:text-orange-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring dark:hover:text-orange-400"
          >
            <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
            {label}
          </a>
        ))}
      </nav>

      <section
        id="ownership"
        aria-labelledby="ownership-title"
        className="mx-auto max-w-7xl scroll-mt-20 px-6 pt-20 sm:px-8 lg:px-10 lg:pt-28"
      >
        <div className="mb-10 grid items-end gap-5 lg:grid-cols-12 lg:gap-12">
          <h2
            id="ownership-title"
            className="max-w-xl text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:col-span-7"
          >
            Your docs. Your infrastructure. Your rules.
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground lg:col-span-5">
            A framework should give you a starting point and the freedom to make
            it yours. Code Atlas leaves the decisions with you.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="relative flex flex-col rounded-2xl border border-orange-600/20 bg-orange-500/5 p-6 sm:p-8 lg:col-span-7 lg:p-10 dark:border-orange-400/20">
            <Server aria-hidden="true" className={`${accentIcon} mb-8`} />
            <h3 className="text-3xl font-semibold tracking-tight">
              Host it your way.
            </h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Deploy on your own server or a platform you choose. Your docs run
              with your application, without a Code Atlas hosting subscription.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              {["Your hosting", "Your repository", "Your deployment"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check
                      aria-hidden="true"
                      className="size-4 text-orange-700 dark:text-orange-400"
                    />
                    {item}
                  </li>
                )
              )}
            </ul>
            <div className="mt-8 rounded-xl border border-border bg-background">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-xs">
                <span className="font-mono">your-docs/</span>
                <span className="text-muted-foreground">
                  Example project structure
                </span>
              </div>
              <FileTree
                aria-label="Example documentation project"
                files={[
                  "app/docs/[[...slug]]/page.tsx",
                  "content/introduction.mdx",
                  "content/quickstart.mdx",
                  "codealtas.config.ts",
                ]}
                className="my-0 rounded-none border-0 bg-transparent p-4"
              />
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Runs in environments that support Next.js server rendering.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <div className="flex flex-col rounded-2xl border border-border p-6 sm:p-8">
              <GitFork aria-hidden="true" className={`${accentIcon} mb-6`} />
              <h3 className="text-2xl font-semibold tracking-tight">
                Free and open source.
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Free to use. Source code you can read and change. Keep your
                documentation in your project, without a required paid service.
              </p>
              <div className="mt-auto flex items-center gap-2 pt-6 text-sm text-muted-foreground">
                <CodeXml aria-hidden="true" className="size-4" />
                Inspect it. Adapt it. Make it yours.
              </div>
            </div>
            <div className="flex flex-col rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
              <Puzzle aria-hidden="true" className={`${accentIcon} mb-6`} />
              <h3 className="text-2xl font-semibold tracking-tight">
                Fits your project.
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Keep your routes, layouts, and pages. Bring in the documentation
                components you need without replacing your application.
              </p>
              <Link
                href="/docs/layout-and-page"
                className={`${textLink} mt-auto pt-6`}
              >
                Explore layouts and pages{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        aria-labelledby="features-title"
        className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-6 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-28"
      >
        <div className="self-start lg:sticky lg:top-24 lg:col-span-4">
          <h2
            id="features-title"
            className="max-w-sm text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
          >
            A small framework. Room to build.
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
            Write the content. Connect the pages. Extend the experience with
            components that belong to your project.
          </p>
          <Link href="/docs/components" className={`${textLink} mt-6`}>
            Explore the components{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <div className="mt-8 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {["Next.js", "React", "TypeScript"].map((name) => (
              <span
                key={name}
                className="rounded-md border border-border px-2.5 py-1.5"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="grid min-w-0 gap-6 sm:grid-cols-2 lg:col-span-8">
          <div className="min-w-0 border-t-2 border-foreground pt-6 sm:col-span-2">
            <div className="flex items-center gap-3">
              <Braces aria-hidden="true" className={accentIcon} />
              <h3 className="text-xl font-semibold">Markdown & MDX</h3>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <p className="text-base leading-relaxed text-muted-foreground">
                Write guides in Markdown. Use MDX when your explanation needs an
                interactive component.
              </p>
              <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm leading-7">
                <span className="text-muted-foreground">
                  getting-started.mdx
                </span>
                <p># Getting started</p>
                <p className="text-orange-700 dark:text-orange-400">
                  &lt;YourComponent /&gt;
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6">
            <Layers aria-hidden="true" className={`${accentIcon} mb-4`} />
            <h3 className="text-lg font-semibold">Ready-made components</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tabs for alternatives. Steps for workflows. File Tree for project
              structure.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { name: "Tabs", href: "/docs/components/tabs" },
                { name: "Steps", href: "/docs/components/steps" },
                { name: "File Tree", href: "/docs/components/file-tree" },
              ].map(({ name, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-6">
            <SlidersHorizontal
              aria-hidden="true"
              className={`${accentIcon} mb-4`}
            />
            <h3 className="text-lg font-semibold">Customizable by design</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Compose layouts, register your own React components, and support
              light and dark themes.
            </p>
            <Link href="/docs/layout-and-page" className={`${textLink} mt-5`}>
              Compose your layout{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="grid gap-5 rounded-xl border border-border p-5 sm:col-span-2 sm:grid-cols-2 sm:p-6">
            <div>
              <h3 className="text-lg font-semibold">Flexible navigation</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Group pages into categories. Set their order. Give readers a
                clear next step.
              </p>
            </div>
            <nav
              aria-label="Example documentation navigation"
              className="border-l border-border pl-5 text-sm"
            >
              <p className="mb-3 text-xs text-muted-foreground">
                Getting Started
              </p>
              {[
                { name: "Introduction", href: "/docs" },
                { name: "Quick Start", href: "/docs/quickstart" },
                { name: "Layout and Page", href: "/docs/layout-and-page" },
              ].map(({ name, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {name}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground"
                  />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section
        id="example"
        aria-labelledby="example-title"
        className="scroll-mt-14 border-y border-border bg-muted/25 py-12 lg:py-16"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
          <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h2
                id="example-title"
                className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
              >
                Plain text. Real components.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                One MDX file, with an interactive result.
              </p>
            </div>
            <Link
              href="/docs/writting/md-and-mdx"
              className={`${textLink} shrink-0`}
            >
              Writing with MDX{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-background lg:grid-cols-12">
            <div className="min-w-0 bg-muted/30 lg:col-span-5">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4 text-xs text-muted-foreground">
                <CodeXml aria-hidden="true" className="size-4" />
                <span className="font-mono">welcome.mdx</span>
                <span className="ml-auto">Source</span>
              </div>
              <pre
                tabIndex={0}
                aria-label="MDX source for the adjacent preview"
                className="overflow-x-auto p-6 text-sm leading-7 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:p-8"
              >
                <code>{mdxExample}</code>
              </pre>
            </div>
            <div className="flex min-w-0 flex-col border-t border-border lg:col-span-7 lg:border-t-0 lg:border-l">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4 text-xs text-muted-foreground">
                <BookOpen aria-hidden="true" className="size-4" />
                Live preview
                <span className="ml-auto">Try the tabs below</span>
              </div>
              <div className="flex flex-1 items-center p-6 sm:p-10 lg:p-12">
                <div className="w-full">
                  <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Make yourself at home
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    Your content. Your components.
                  </p>
                  <Tabs className="mt-8 mb-0">
                    <Tab name="Markdown">
                      <p className="text-base leading-relaxed">
                        Write guides in plain Markdown.
                      </p>
                    </Tab>
                    <Tab name="React">
                      <p className="text-base leading-relaxed">
                        Bring your own React components.
                      </p>
                    </Tab>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="start"
        aria-labelledby="start-title"
        className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-6 pt-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:pt-28"
      >
        <div className="lg:col-span-5">
          <h2
            id="start-title"
            className="max-w-md text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl"
          >
            Start fresh. Or bring your project.
          </h2>
          <div className="mt-8 space-y-6">
            <div className="border-l-2 border-orange-700 pl-4 dark:border-orange-400">
              <h3 className="text-base font-semibold">
                A new home for your docs
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Start with a Next.js project and the included layouts. Add your
                first pages, then make it your own.
              </p>
            </div>
            <div className="border-l-2 border-border pl-4">
              <h3 className="text-base font-semibold">
                Part of your existing app
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Connect documentation to your Next.js and React app while
                keeping your application structure.
              </p>
            </div>
          </div>
          <Link href="/docs/quickstart" className={`${primaryLink} mt-8`}>
            Get started <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="min-w-0 self-center lg:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-4 text-sm">
            <span className="font-medium">The path to your first page</span>
            <span className="text-xs text-muted-foreground">
              Interactive guide
            </span>
          </div>
          <Steps className="my-0">
            <Step label="Prepare your project" icon="lucide:layers">
              <h3 className="text-lg font-semibold">
                Start with Next.js and React.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Use a new project or your existing application. Check the Quick
                Start guide for supported versions and setup instructions.
              </p>
              <Link href="/docs/quickstart" className={`${textLink} mt-5`}>
                Read the prerequisites{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Step>
            <Step
              label="Connect your documentation"
              icon="lucide:sliders-horizontal"
            >
              <h3 className="text-lg font-semibold">
                Your routes. Your layouts.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Configure your document categories in codealtas.config.ts.
                Compose DocsLayout and DocsPage in the routes you choose.
              </p>
              <Link href="/docs/layout-and-page" className={`${textLink} mt-5`}>
                Explore the setup{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Step>
            <Step label="Write your first page" icon="lucide:braces">
              <h3 className="text-lg font-semibold">
                Content lives in your project.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Add Markdown or MDX to your content directory, connect it in
                your configuration, and extend it with components.
              </p>
              <Link
                href="/docs/writting/md-and-mdx"
                className={`${textLink} mt-5`}
              >
                Start writing{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Step>
          </Steps>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Use the arrows to explore the setup. Detailed instructions are in
            the Quick Start guide.
          </p>
        </div>
      </section>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-start justify-between gap-6 border-t border-border px-6 pt-8 sm:flex-row sm:items-center sm:px-8 lg:mt-20 lg:px-10">
        <p className="text-2xl font-semibold tracking-tight">
          Build your documentation. Keep it yours.
        </p>
        <Link href="/docs" className={`${textLink} shrink-0`}>
          Read the documentation{" "}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </main>
  )
}
