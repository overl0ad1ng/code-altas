import assert from "node:assert/strict"
import test from "node:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createElement, Fragment } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createJiti } from "jiti"
import { fileURLToPath } from "node:url"

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  fsCache: false,
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { renderDoc } = await jiti.import("../src/server/render-doc.tsx")
const { rehypeHeadingIds } = await jiti.import(
  "../src/server/rehype-heading-ids.ts"
)
const { DocsPage } = await jiti.import("../src/ui/pages/DocsPage.tsx")
const { ChangelogPage } = await jiti.import("../src/ui/pages/ChangelogPage.tsx")
const { Changelogs, Changelog } = await jiti.import(
  "../src/ui/mdx/components/changelog.tsx"
)
const { ConfigProvider } = await jiti.import("../src/lib/config-provider.tsx")
const { ChangelogTags } = await jiti.import(
  "../src/components/changelog-tags.tsx"
)
const { Tags } = await jiti.import("../src/ui/mdx/components/tags.tsx")
const { DocsNav } = await jiti.import("../src/ui/navigation/docs-nav.tsx")
const { default: BranchedMenu } = await jiti.import(
  "../src/primitives/branched-menu.tsx"
)
const { Props, Prop } = await jiti.import("../src/ui/mdx/components/props.tsx")
const { Steps, Step } = await jiti.import("../src/ui/mdx/components/steps.tsx")
const { CodeGroup } = await jiti.import(
  "../src/ui/mdx/components/code-group.tsx"
)
const { Hint, HintTitle, HintContent } = await jiti.import(
  "../src/ui/mdx/components/hint.tsx"
)
const { PackageInstall } = await jiti.import(
  "../src/ui/mdx/components/package-install.tsx"
)
const { getSiteMetadata, getDocMetadata } = await jiti.import(
  "../src/server/metadata.ts"
)

test("docs menu preserves nested groups and opens all ancestors of the active page", () => {
  const nav = DocsNav({
    categories: [
      {
        name: "Getting Started",
        slug: "index",
        icon: "lucide:lamp",
        docs: [
          {
            name: "Getting Started",
            docs: [{ name: "Introduction", slug: "index" }],
          },
          {
            name: "Writting",
            slug: "writting",
            docs: [
              {
                name: "Synatx",
                slug: "synatx",
                docs: [
                  { name: "Math", slug: "math" },
                  { name: "Draft", slug: "draft", draft: true },
                ],
              },
              {
                name: "Empty",
                slug: "empty",
                docs: [{ name: "Disabled", slug: "disabled", disabled: true }],
              },
            ],
          },
        ],
      },
    ],
  })
  const { items } = nav.props.children[1].props.children.props.categories[0]
  assert.deepEqual(
    items[1].children.map((item) => item.label),
    ["Synatx"]
  )
  assert.deepEqual(
    items[1].children[0].children.map(({ label, value }) => ({ label, value })),
    [{ label: "Math", value: "/docs/writting/synatx/math" }]
  )
  const html = renderToStaticMarkup(
    createElement(BranchedMenu, {
      items,
      active: "/docs/writting/synatx/math",
      defaultOpen: -1,
    })
  )
  const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(
    ([button]) => button
  )
  for (const label of ["Writting", "Synatx"]) {
    assert.match(
      buttons.find((button) => button.includes(`>${label}</span>`)),
      /aria-expanded="true"/
    )
  }
  const math = buttons.find((button) => button.includes(">Math</span>"))
  assert.match(math, /aria-current="true"/)
  assert.match(math, /tabindex="0"/)
  assert.match(html, /margin-left:28px/)
  const collapsed = renderToStaticMarkup(
    createElement(BranchedMenu, {
      items,
      active: "",
      defaultOpen: -1,
    })
  )
  assert.match(
    [...collapsed.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].find(
      ([button]) => button.includes(">Math</span>")
    )[0],
    /tabindex="-1"/
  )
})

test("Props renders MDX Prop rows in a Surface with four equal columns", async () => {
  const rendered = await renderDoc(
    doc(
      '<Props name="Tabs">\n<Prop property="children" type="React.ReactNode" defaultValue="-" description="Panel content" />\n<Prop property="defaultIndex" type="number" defaultValue={0} description="Initial tab" />\n</Props>'
    )
  )
  const html = renderToStaticMarkup(rendered.content)
  assert.match(html, />Tabs Props<\/span>/)
  assert.match(html, />2 properties<\/span>/)
  for (const label of ["Property", "Type", "Default", "Description"]) {
    assert.match(html, new RegExp(`<th[^>]*scope="col"[^>]*>${label}</th>`))
  }
  assert.equal((html.match(/<col class="w-1\/4"/g) || []).length, 4)
  assert.match(html, /table-fixed/)
  assert.match(html, /min-w-\[640px\]/)
  assert.match(html, /overflow-x-auto/)
  const cells = [...html.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map((match) =>
    match[1].replace(/<[^>]*>/g, "")
  )
  assert.deepEqual(cells, [
    "children",
    "React.ReactNode",
    "-",
    "Panel content",
    "defaultIndex",
    "number",
    "0",
    "Initial tab",
  ])
})

test("Props counts single and fragment children, supports empty lists, and rejects other elements", () => {
  const row = createElement(Prop, {
    property: "children",
    type: "ReactNode",
    defaultValue: "-",
    description: "",
  })
  for (const children of [
    row,
    [row],
    createElement(Fragment, null, "\n", row, false, null),
  ]) {
    const html = renderToStaticMarkup(
      createElement(Props, { name: "Tabs", children })
    )
    assert.match(html, />1 properties<\/span>/)
    assert.equal((html.match(/<td /g) || []).length, 4)
  }
  assert.match(
    renderToStaticMarkup(createElement(Props, { name: "Empty", children: [] })),
    />0 properties<\/span>/
  )
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(Props, {
          name: "Invalid",
          children: createElement("div", null, "Other content"),
        })
      ),
    /Props only accepts Prop children/
  )
})

test("Tabs renders named tabs, server-resolved icons, Markdown panels, and unique relationships", async () => {
  const source =
    '<Tabs>\n<Tab name="New project" icon="lucide:square-terminal">\n\n## First panel\n\nFirst content.\n\n</Tab>\n<Tab name="Migrate" icon="simple:github">\n\n## Second panel\n\nSecond content.\n\n</Tab>\n</Tabs>'
  const rendered = await renderDoc(doc(source))
  const html = renderToStaticMarkup(rendered.content)
  assert.equal((html.match(/role="tab"/g) || []).length, 2)
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 2)
  assert.match(html, /aria-selected="true"/)
  assert.match(html, /New project/)
  assert.match(html, /Migrate/)
  assert.match(html, /<svg/)
  assert.match(html, /<h2[^>]*>First panel/)
  assert.match(html, /data-slot="tabs-indicator"/)
})
const doc = (content, extension = ".mdx") => ({
  slug: "/example",
  title: "Configured title",
  categorySlug: "index",
  contentPath: "index/example",
  draft: false,
  disabled: false,
  content,
  extension,
})

test("CodeGroup renders the documented fences with language icons and intact code blocks", async () => {
  const source = await readFile(
    new URL(
      "../../../apps/web/content/components/code-groups.mdx",
      import.meta.url
    ),
    "utf8"
  )
  const rendered = await renderDoc(doc(source))
  const html = renderToStaticMarkup(rendered.content)
  const tabs = [
    ...html.matchAll(/<button\b[^>]*role="tab"[^>]*>[\s\S]*?<\/button>/g),
  ]
  assert.equal(tabs.length, 2)
  assert.match(tabs[0][0], /src\/main\.tsx/)
  assert.match(tabs[0][0], /<svg[^>]*>.*<title>TypeScript<\/title>/)
  assert.match(tabs[1][0], /src\/index\/html/)
  assert.match(tabs[1][0], /<svg[^>]*>.*<title>HTML5<\/title>/)
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 2)
  assert.equal((html.match(/aria-label="Copy code"/g) || []).length, 3)
  assert.match(html, /codeblock-lines/)
  assert.match(html, /language-tsx/)
  assert.match(html, /language-html/)
  assert.match(html, /--shiki-light/)
})

test("CodeGroup supports language labels, text fallback, and default selection", async () => {
  const rendered = await renderDoc(
    doc(
      "<CodeGroup defaultIndex={1}>\n\n```js\nconst value = 1\n```\n\n```\nplain text\n```\n\n</CodeGroup>"
    )
  )
  const html = renderToStaticMarkup(rendered.content)
  const tabs = [
    ...html.matchAll(/<button\b[^>]*role="tab"[^>]*>[\s\S]*?<\/button>/g),
  ]
  assert.match(tabs[0][0], /JavaScript/)
  assert.match(tabs[0][0], />js<\/button>/)
  assert.match(tabs[0][0], /aria-selected="false"/)
  assert.match(tabs[1][0], />text<\/button>/)
  assert.match(tabs[1][0], /aria-selected="true"/)
  assert.match(html, /plain text/)
  assert.equal(
    renderToStaticMarkup(createElement(CodeGroup, { children: [] })),
    ""
  )
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(
          CodeGroup,
          null,
          createElement("p", null, "Other content")
        )
      ),
    /CodeGroup only accepts fenced code blocks/
  )
})

test("PackageInstall registers in MDX with four manager icons and copyable commands", async () => {
  const rendered = await renderDoc(
    doc('<PackageInstall package="@code-altas/ui@beta" />')
  )
  const html = renderToStaticMarkup(rendered.content)
  const tabs = [
    ...html.matchAll(/<button\b[^>]*role="tab"[^>]*>[\s\S]*?<\/button>/g),
  ]
  assert.equal(tabs.length, 4)
  for (const [index, manager] of ["npm", "pnpm", "yarn", "bun"].entries()) {
    assert.match(tabs[index][0], new RegExp(`>${manager}</button>`))
    assert.match(tabs[index][0], /<svg[^>]*>.*<title>/)
    assert.match(tabs[index][0], new RegExp(`aria-selected="${index === 0}"`))
  }
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 4)
  assert.equal((html.match(/aria-label="Copy code"/g) || []).length, 4)
  const commands = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(
    (match) => match[1].replace(/<[^>]*>/g, "")
  )
  assert.deepEqual(commands, [
    "npm install @code-altas/ui@beta",
    "pnpm install @code-altas/ui@beta",
    "yarn add @code-altas/ui@beta",
    "bun add @code-altas/ui@beta",
  ])
})

test("PackageInstall supports each default manager, multiple packages, and rejects blank names", () => {
  for (const [index, defaultManager] of [
    "npm",
    "pnpm",
    "yarn",
    "bun",
  ].entries()) {
    const html = renderToStaticMarkup(
      createElement(PackageInstall, {
        package: "  react@19 react-dom@19  ",
        defaultManager,
      })
    )
    const tabs = [
      ...html.matchAll(/<button\b[^>]*role="tab"[^>]*>[\s\S]*?<\/button>/g),
    ]
    for (const [tabIndex, tab] of tabs.entries())
      assert.match(tab[0], new RegExp(`aria-selected="${tabIndex === index}"`))
    assert.match(html, /npm install react@19 react-dom@19/)
    assert.match(html, /pnpm install react@19 react-dom@19/)
  }
  assert.throws(
    () => renderToStaticMarkup(createElement(PackageInstall, { package: " " })),
    /non-empty package/
  )
})

test("Hint renders rich MDX titles, content, and server-resolved icons", async () => {
  const rendered = await renderDoc(
    doc(
      '<Hint icon="simple:typescript">\n<HintTitle>\n\n**TypeScript** note\n\n</HintTitle>\n<HintContent>\n\nUse a [typed component](https://example.com).\n\n```tsx\nconst value: number = 1\n```\n\n</HintContent>\n</Hint>'
    )
  )
  const html = renderToStaticMarkup(rendered.content)
  assert.match(html, /data-slot="hint"/)
  assert.match(html, /<title>TypeScript<\/title>/)
  assert.match(html, /<strong[^>]*>TypeScript<\/strong>/)
  assert.match(html, /href="https:\/\/example.com"/)
  assert.match(html, /language-tsx/)
  assert.doesNotMatch(html, /aria-expanded|aria-hidden="true"[^>]*inert/)
})

test("Hint applies every combination of allowCollapse and collapsed", () => {
  for (const allowCollapse of [undefined, true, false]) {
    for (const collapsed of [undefined, true, false]) {
      const collapsible = allowCollapse ?? collapsed !== undefined
      const isCollapsed = collapsible && (collapsed ?? true)
      const html = renderToStaticMarkup(
        createElement(
          Hint,
          { allowCollapse, collapsed },
          createElement(HintTitle, null, "Title"),
          createElement(HintContent, null, "Content")
        )
      )
      assert.match(html, new RegExp(`data-collapsed="${isCollapsed}"`))
      assert.equal(html.includes('inert=""'), isCollapsed)
      assert.match(
        html,
        new RegExp(`grid-template-rows:${isCollapsed ? "0fr" : "1fr"}`)
      )
      assert.match(html, /transition-\[grid-template-rows,opacity\]/)
      assert.match(html, />Content<\/div>/)
      if (collapsible) {
        assert.match(html, /data-slot="hint-title" role="button" tabindex="0"/)
        assert.match(html, new RegExp(`aria-expanded="${!isCollapsed}"`))
        const contentId = html.match(/aria-controls="([^"]+)"/)[1]
        assert.ok(html.includes(`id="${contentId}" data-slot="hint-content"`))
      } else {
        assert.doesNotMatch(html, /<button|aria-expanded/)
      }
    }
  }
})

test("Hint supports component-wrapped slots and interactive title children", () => {
  const CustomTitle = () =>
    createElement(
      HintTitle,
      null,
      createElement("a", { href: "/docs" }, "Read docs")
    )
  const CustomContent = () =>
    createElement(
      HintContent,
      null,
      createElement("em", null, "Custom content")
    )
  const html = renderToStaticMarkup(
    createElement(
      Hint,
      { collapsed: false },
      createElement(CustomTitle),
      createElement(CustomContent)
    )
  )
  assert.match(html, /<a href="\/docs">Read docs<\/a>/)
  assert.match(html, /<em>Custom content<\/em>/)
  assert.match(html, /aria-expanded="true"/)
  assert.doesNotMatch(html, /<button[^>]*>[\s\S]*?<a /)
  for (const Component of [HintTitle, HintContent]) {
    assert.throws(
      () => renderToStaticMarkup(createElement(Component)),
      /must be inside Hint/
    )
  }
})

test("Hint documentation renders sections, every color type, and collapsible titles", async () => {
  const source = await readFile(
    new URL("../../../apps/web/content/components/hint.mdx", import.meta.url),
    "utf8"
  )
  const html = renderToStaticMarkup((await renderDoc(doc(source))).content)
  for (const section of ["Usage", "Collapse", "Type", "Props"]) {
    assert.match(html, new RegExp(`<h2[^>]*>${section}</h2>`))
  }
  for (const [type, color] of Object.entries({
    default: "border-border",
    info: "border-blue-500/30",
    success: "border-emerald-500/30",
    warning: "border-amber-500/30",
    danger: "border-red-500/30",
    error: "border-red-500/30",
    tip: "border-violet-500/30",
  })) {
    const hint = html.match(new RegExp(`<aside[^>]*data-type="${type}"[^>]*>`))
    assert.ok(hint, `Missing hint type: ${type}`)
    assert.ok(hint[0].includes(color))
  }
  assert.match(html, /role="button" tabindex="0" aria-expanded="false"/)
  assert.match(html, /role="button" tabindex="0" aria-expanded="true"/)
})

test("Steps renders the selected label, icon, Markdown content, and exact page count", async () => {
  const rendered = await renderDoc(
    doc(
      '<Steps defaultIndex={1} className="custom-steps">\n<Step label="First">\n\n## First content\n\n</Step>\n<Step label="Second" icon="lucide:check">\n\n## Second content\n\n**Ready**\n\n</Step>\n</Steps>'
    )
  )
  const html = renderToStaticMarkup(rendered.content)
  assert.match(html, /data-slot="steps"[^>]*custom-steps/)
  assert.match(html, />Second<\/span>/)
  assert.match(html, /<svg/)
  assert.match(html, /<h2[^>]*>Second content<\/h2>/)
  assert.match(html, /<strong>Ready<\/strong>/)
  assert.doesNotMatch(html, /First content/)
  assert.match(html, /aria-label="Next step" disabled=""/)
  assert.match(html, /data-slot="steps-count"[^>]*>2 \/ 2<\/span>/)
})

test("Steps accepts fragments, handles empty and single steps, and validates children and defaultIndex", () => {
  assert.equal(renderToStaticMarkup(createElement(Steps, { children: [] })), "")
  const child = createElement(Step, { label: "Only", children: "Content" })
  for (const defaultIndex of [-1, 9, 0.5, NaN]) {
    const html = renderToStaticMarkup(
      createElement(Steps, {
        defaultIndex,
        children: createElement(Fragment, null, "\n", child, null, false),
      })
    )
    assert.match(html, />Only<\/span>/)
    assert.match(html, /data-slot="steps-count"[^>]*>1 \/ 1<\/span>/)
    assert.equal((html.match(/disabled=""/g) || []).length, 2)
  }
  assert.throws(
    () => Steps({ children: createElement("div", null, "Invalid") }),
    /Steps only accepts Step children/
  )
})

test("heading anchors support Chinese, inline formatting, repeated titles, and every depth", async () => {
  for (const extension of [".md", ".mdx"]) {
    const rendered = await renderDoc(
      doc(
        "# Top\n\n## 中文 **标题** `code`\n\n### Same\n\n#### Same\n\n##### Same-1\n\n###### !!!",
        extension
      )
    )
    const html = renderToStaticMarkup(rendered.content)
    const ids = [...html.matchAll(/<h[1-6][^>]*id="([^"]*)"/g)].map(
      (match) => match[1]
    )
    assert.deepEqual(ids, [
      "top",
      "中文-标题-code",
      "same",
      "same-1",
      "same-1-1",
      "section",
    ])
    assert.match(html, /<strong>标题<\/strong>/)
  }
})

test("heading anchors preserve explicit IDs and reserve JSX IDs before generating anchors", () => {
  const heading = (title, id) => ({
    type: "element",
    tagName: "h2",
    properties: id ? { id } : {},
    children: [{ type: "text", value: title }],
  })
  const first = heading("Example")
  const explicit = heading("Custom title", "example")
  const second = heading("Example")
  const jsx = {
    type: "mdxJsxFlowElement",
    name: "h3",
    attributes: [{ type: "mdxJsxAttribute", name: "id", value: "example-1" }],
  }
  rehypeHeadingIds()({ type: "root", children: [first, explicit, second, jsx] })
  assert.equal(explicit.properties.id, "example")
  assert.equal(first.properties.id, "example-2")
  assert.equal(second.properties.id, "example-3")
})

test("renders UTF-8 Markdown, GFM, and styled semantic elements", async () => {
  const rendered = await renderDoc(
    doc(
      "## 中文标题\n\nHello **world** and `code`.\n\n- [x] Done\n\n~~old~~\n\n| Name | Value |\n| --- | --- |\n| 中文 | 42 |\n\n```js\nconst x = 1\n```",
      ".md"
    )
  )
  const html = renderToStaticMarkup(rendered.content)
  assert.equal(rendered.title, "Configured title")
  assert.match(html, /<h2[^>]*>中文标题<\/h2>/)
  assert.match(html, /<strong>world<\/strong>/)
  assert.match(html, /<del>old<\/del>/)
  assert.match(html, /<input[^>]*type="checkbox"[^>]*checked/)
  assert.match(html, /<table/)
  assert.match(html, /<code[^>]*language-js/)
  assert.match(html, /overflow-x-auto/)
})

test("code blocks have dual-theme highlighting and copy controls without changing code text", async () => {
  for (const extension of [".md", ".mdx"]) {
    const source = 'const greeting = "hello"\n  console.log(greeting)'
    const rendered = await renderDoc(
      doc(`Inline \`code\`.\n\n\`\`\`ts\n${source}\n\`\`\``, extension)
    )
    const html = renderToStaticMarkup(rendered.content)
    assert.match(html, /shiki-themes github-light github-dark/)
    assert.match(html, /--shiki-light:/)
    assert.match(html, /--shiki-dark:/)
    assert.equal((html.match(/aria-label="Copy code"/g) || []).length, 1)
    const code = html.match(
      /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/
    )?.[1]
    assert.ok(code)
    assert.equal(code.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"'), source)
  }
})

test("code blocks omit the fence newline but preserve intentional blank lines", async () => {
  for (const extension of [".md", ".mdx"]) {
    for (const language of ["ts", "", "not-a-real-language"]) {
      for (const source of [
        "const x = 1",
        "const x = 1\n\nconst y = 2",
        "const x = 1\n",
      ]) {
        const rendered = await renderDoc(
          doc(`\`\`\`${language}\n${source}\n\`\`\``, extension)
        )
        const html = renderToStaticMarkup(rendered.content)
        assert.equal(
          (html.match(/class="line"/g) || []).length,
          source.split("\n").length
        )
      }
    }
  }
})

test("code blocks with missing or unknown languages remain readable and copyable", async () => {
  for (const language of ["", "not-a-real-language"]) {
    const rendered = await renderDoc(
      doc(`\`\`\`${language}\nplain text\n\`\`\``)
    )
    const html = renderToStaticMarkup(rendered.content)
    assert.match(html, /aria-label="Copy code"/)
    assert.match(html, /plain text/)
  }
})

test("code block headers show a quoted title or fall back to the language", async () => {
  for (const metadata of [
    'title="Example component"',
    "title='Example component'",
  ]) {
    const rendered = await renderDoc(
      doc(`\`\`\`tsx ${metadata}\nconst x = 1\n\`\`\``)
    )
    const html = renderToStaticMarkup(rendered.content)
    assert.match(html, />Example component<\/span>/)
    assert.doesNotMatch(html, />tsx<\/span>/)
    assert.match(html, /codeblock-lines/)
  }
  const rendered = await renderDoc(doc("```tsx\nconst x = 1\n```"))
  assert.match(renderToStaticMarkup(rendered.content), />tsx<\/span>/)
})

test("frontmatter becomes a page title and is excluded from content", async () => {
  const rendered = await renderDoc(doc("---\ntitle: 中文页面\n---\n\nBody"))
  assert.equal(rendered.title, "中文页面")
  assert.doesNotMatch(renderToStaticMarkup(rendered.content), /title:|中文页面/)
  for (const title of ['" "', "123", "null"]) {
    assert.equal(
      (await renderDoc(doc(`---\ntitle: ${title}\n---\nBody`))).title,
      "Configured title"
    )
  }
})

test("frontmatter tags accept only nonempty strings and preserve unique names", async () => {
  for (const extension of [".md", ".mdx"]) {
    const rendered = await renderDoc(
      doc(
        '---\ntags: [Beta, " Beta ", Stable, 123, null, " "]\n---\nBody',
        extension
      )
    )
    assert.deepEqual(rendered.tags, ["Beta", "Stable"])
    assert.doesNotMatch(renderToStaticMarkup(rendered.content), /Beta|Stable/)
    for (const value of ["", "tags: Beta", "tags: null", "tags: {}"]) {
      assert.deepEqual(
        (await renderDoc(doc(`---\n${value}\n---\nBody`, extension))).tags,
        []
      )
    }
  }
})

test("Tags uses configured text colors and 20% border opacity, omitting unknown tags", () => {
  const html = renderToStaticMarkup(
    createElement(Tags, {
      tags: ["Beta", "Unknown", "Beta", "toString"],
      colors: { Beta: "#1447E6" },
    })
  )
  assert.match(html, /color:#1447E6/)
  assert.match(
    html,
    /border-color:color-mix\(in srgb, #1447E6 20%, transparent\)/
  )
  assert.equal((html.match(/>Beta<\/li>/g) || []).length, 1)
  assert.doesNotMatch(html, /Unknown|toString/)
  assert.equal(
    renderToStaticMarkup(createElement(Tags, { tags: ["Beta"] })),
    ""
  )
})

test("DocsPage places configured frontmatter tags below its description", async () => {
  const cwd = process.cwd()
  const fixture = await mkdtemp(join(tmpdir(), "codeatlas-tags-"))
  try {
    await mkdir(join(fixture, "content", "index"), { recursive: true })
    await writeFile(
      join(fixture, "codealtas.config.ts"),
      `export default {
      title: "Site", description: "Site description", logo: "/logo.png",
      docs: {
        tags: { Beta: "#1447E6" },
        categories: [{ name: "Start", icon: "lamp", slug: "index", docs: [{ name: "Home", slug: "index" }, { name: "Fallback title", slug: "fallback" }] }]
      }
    }`
    )
    await writeFile(
      join(fixture, "content", "index", "index.mdx"),
      "---\ntitle: Tagged page\ndescription: Page description\ntags:\n  - Beta\n  - Unknown\n---\nBody text"
    )
    await writeFile(
      join(fixture, "content", "index", "fallback.md"),
      "Body without frontmatter"
    )
    const siteMetadata = await getSiteMetadata(fixture)
    assert.deepEqual(siteMetadata.title, {
      default: "Site",
      template: "%s | Site",
    })
    assert.deepEqual(siteMetadata.icons, { icon: "/logo.png" })
    assert.deepEqual(await getDocMetadata("/", fixture), {
      title: "Tagged page",
      description: "Page description",
    })
    assert.deepEqual(await getDocMetadata("/fallback", fixture), {
      title: "Fallback title",
      description: "Site description",
    })
    await assert.rejects(
      getDocMetadata("/missing", fixture),
      /NEXT_HTTP_ERROR_FALLBACK;404/
    )
    process.chdir(fixture)
    const html = renderToStaticMarkup(
      await DocsPage({
        params: Promise.resolve({}),
        aside: createElement("div", null, "Extra sidebar card"),
      })
    )
    assert.match(html, /Tagged page/)
    assert.match(html, /data-slot="docs-sidebar"/)
    assert.match(
      html,
      /data-slot="docs-sidebar-content"[^>]*>.*Extra sidebar card/
    )
    assert.match(html, />Beta<\/li>/)
    assert.doesNotMatch(html, /Unknown/)
    assert.ok(html.indexOf("Page description") < html.indexOf(">Beta</li>"))
    assert.ok(html.indexOf(">Beta</li>") < html.indexOf("Body text"))
  } finally {
    process.chdir(cwd)
    await rm(fixture, { recursive: true, force: true })
  }
})

test("registered JSX components and overrides keep their props", async () => {
  const rendered = await renderDoc(
    doc('## Heading\n\n<Notice tone="tip">Message</Notice>'),
    {
      Notice: ({ children, tone }) =>
        createElement("aside", { "data-tone": tone }, children),
      h2: (props) => createElement("h2", { ...props, "data-custom": true }),
    }
  )
  const html = renderToStaticMarkup(rendered.content)
  assert.match(html, /data-tone="tip">Message/)
  assert.match(html, /data-custom="true">Heading/)
})

test("Markdown mode treats braces as text rather than JavaScript", async () => {
  const rendered = await renderDoc(doc("Literal {unknownVariable}", ".md"))
  assert.match(
    renderToStaticMarkup(rendered.content),
    /Literal \{unknownVariable\}/
  )
})

test("syntax and frontmatter errors preserve their cause and document slug", async () => {
  for (const source of ["<Broken", "---\ntitle: [broken\n---\nBody"]) {
    await assert.rejects(
      renderDoc(doc(source)),
      (error) =>
        error.message.includes("/example") && error.cause instanceof Error
    )
  }
})

test("missing components throw instead of silently disappearing", async () => {
  const rendered = await renderDoc(doc("<NotRegistered />"))
  assert.throws(() => renderToStaticMarkup(rendered.content), /NotRegistered/)
})

test("MDX imports and exports cannot replace registered components", async () => {
  const rendered = await renderDoc(
    doc(
      'import { readFile } from "node:fs"\n\nexport const hidden = "hidden"\n\n<Notice />'
    ),
    {
      Notice: () => createElement("div", null, "Registered component"),
    }
  )
  assert.equal(
    renderToStaticMarkup(rendered.content),
    "<div>Registered component</div>"
  )
})

test("ChangelogPage reads standalone MDX and supports components without docs config", async () => {
  const cwd = process.cwd()
  const fixture = await mkdtemp(join(tmpdir(), "code-atlas-changelog-"))
  try {
    await mkdir(join(fixture, "content"))
    await writeFile(
      join(fixture, "content", "changelog.mdx"),
      '## 更新日志\n\n- Added **MDX**\n\n<Notice>Custom content</Notice>\n\n<FileTree files={["content/changelog.mdx"]} />'
    )
    process.chdir(fixture)
    const page = await ChangelogPage({
      components: {
        Notice: ({ children }) => createElement("aside", null, children),
      },
    })
    const html = renderToStaticMarkup(page)
    assert.match(html, /更新日志/)
    assert.match(html, /<strong[^>]*>MDX<\/strong>/)
    assert.match(html, /<aside>Custom content<\/aside>/)
    assert.match(html, /changelog\.mdx/)
    assert.doesNotMatch(html, /data-slot="docs-sidebar"/)

    await writeFile(join(fixture, "content", "changelog.mdx"), "")
    const empty = renderToStaticMarkup(await ChangelogPage())
    assert.match(empty, /<article[^>]*><\/article>/)
    assert.doesNotMatch(empty, /更新日志|Custom content/)
  } finally {
    process.chdir(cwd)
    await rm(fixture, { recursive: true, force: true })
  }
})

test("ChangelogPage returns 404 for a missing file and surfaces invalid MDX", async () => {
  const cwd = process.cwd()
  const fixture = await mkdtemp(join(tmpdir(), "code-atlas-changelog-"))
  try {
    process.chdir(fixture)
    await assert.rejects(ChangelogPage(), /NEXT_HTTP_ERROR_FALLBACK;404/)
    await mkdir(join(fixture, "content"))
    await writeFile(join(fixture, "content", "changelog.mdx"), "<Broken")
    await assert.rejects(
      ChangelogPage(),
      /Failed to compile document \/changelog/
    )
  } finally {
    process.chdir(cwd)
    await rm(fixture, { recursive: true, force: true })
  }
})

test("Changelogs renders MDX entries with UTC calendar dates, all tags, and Markdown content", async () => {
  const rendered = await renderDoc(
    doc(
      '<Changelogs sortBy="date">\n<Changelog date="2026/10/2" title="First release" tags={["version-released", "fix", "version-released"]}>\n\nAdded **MDX**.\n\n</Changelog>\n<Changelog date="2026-10-12" title="Latest release">\n\nLatest content.\n\n</Changelog>\n</Changelogs>'
    )
  )
  const html = renderToStaticMarkup(
    createElement(
      ConfigProvider,
      { config: { title: "Site", description: "", logo: "/logo.png" } },
      rendered.content
    )
  )
  assert.ok(html.indexOf("Latest release") < html.indexOf("First release"))
  assert.match(html, /datetime="2026-10-02"/i)
  assert.match(html, /October 2, 2026/)
  assert.match(html, /October 12, 2026/)
  assert.match(html, /<strong[^>]*>MDX<\/strong>/)
  assert.equal((html.match(/>version-released<\/li>/g) || []).length, 1)
  assert.match(html, />fix<\/li>/)
  assert.equal((html.match(/aria-label="Release tags"/g) || []).length, 1)
})

test("Changelog tags use configured colors and keep unmatched or blank colors gray", () => {
  const html = renderToStaticMarkup(
    createElement(
      ConfigProvider,
      {
        config: {
          title: "Site",
          description: "",
          logo: "/logo.png",
          docs: { tags: { "Version Released": "#8A0194", Blank: "  " } },
        },
      },
      createElement(ChangelogTags, {
        tags: ["Version Released", "Unknown", "Blank", "toString"],
      })
    )
  )
  assert.match(html, /color:#8A0194/)
  assert.match(
    html,
    /border-color:color-mix\(in srgb, #8A0194 20%, transparent\)/
  )
  assert.match(
    html,
    /background-color:color-mix\(in srgb, #8A0194 10%, transparent\)/
  )
  for (const name of ["Unknown", "Blank", "toString"]) {
    const tag = html.match(new RegExp(`<li([^>]*)>${name}</li>`))
    assert.ok(tag)
    assert.match(tag[1], /text-muted-foreground/)
    assert.doesNotMatch(tag[1], /style=/)
  }
})

test("Changelogs preserves index and equal-date order, accepts fragments, and validates dates", () => {
  const entries = createElement(
    Fragment,
    null,
    createElement(Changelog, { date: "2026/10/2", title: "First" }),
    createElement(Changelog, { date: "2026/10/12", title: "Second" }),
    createElement(Changelog, { date: "2026/10/12", title: "Third" })
  )
  const ordered = renderToStaticMarkup(
    createElement(Changelogs, { sortBy: "index" }, entries)
  )
  assert.ok(ordered.indexOf("First") < ordered.indexOf("Second"))
  assert.ok(ordered.indexOf("Second") < ordered.indexOf("Third"))
  const sorted = renderToStaticMarkup(createElement(Changelogs, null, entries))
  assert.ok(sorted.indexOf("Second") < sorted.indexOf("Third"))
  assert.ok(sorted.indexOf("Third") < sorted.indexOf("First"))
  assert.equal(renderToStaticMarkup(createElement(Changelogs)), "")
  assert.throws(
    () => renderToStaticMarkup(createElement(Changelogs, null, "Unexpected")),
    /only accepts Changelog children/
  )
  for (const date of ["invalid", "2026/2/30", "2026/13/1"]) {
    assert.throws(
      () =>
        renderToStaticMarkup(createElement(Changelog, { date, title: "Bad" })),
      /Invalid changelog date/
    )
  }
})
