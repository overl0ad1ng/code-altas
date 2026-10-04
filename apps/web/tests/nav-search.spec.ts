import { test, expect } from "@playwright/test"

test("sidebar searches config titles in the current category without API requests", async ({
  page,
}) => {
  const requests: string[] = []
  page.on("request", (request) => {
    if (request.url().includes("/api/search")) requests.push(request.url())
  })
  await page.goto("/docs")
  const sidebar = page.getByRole("complementary", {
    name: "Documentation Navigation",
  })
  const input = sidebar.getByRole("textbox", { name: "Search article titles…" })
  const menu = sidebar.locator("[data-slot=scroll-area] nav")
  const results = menu.locator("button:not([aria-expanded])")

  await input.fill("  mD  ")
  await expect(results).toHaveText(["MD and MDX"])
  await expect(
    menu.getByRole("button", { name: "Writting", exact: true })
  ).toHaveAttribute("aria-expanded", "true")
  await expect(menu.locator("svg path").first()).toBeVisible()
  await expect(
    menu.getByRole("button", { name: "Getting Started", exact: true })
  ).toHaveCount(0)
  await input.fill("documentation system") // Body text in the introduction.
  await expect(sidebar.getByRole("status")).toHaveText("No results found.")
  await input.fill("Writting") // A group label, not an article.
  await expect(sidebar.getByRole("status")).toHaveText("No results found.")
  await input.fill("Tabs") // An article in another category.
  await expect(sidebar.getByRole("status")).toHaveText("No results found.")

  await input.fill("a")
  await expect(results).toHaveText([
    "Quick Start",
    "Layout And Page",
    "MD and MDX",
    "Frontmatter",
    "Mermaid",
    "KaTeX",
    "Internationalization",
  ])
  await input.fill("quick start")
  await menu.getByRole("button", { name: "Quick Start", exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/quickstart$/)
  await expect(input).toHaveValue("")
  await expect(
    menu.getByRole("button", { name: "Quick Start", exact: true })
  ).toHaveAttribute("aria-current", "true")
  expect(requests).toEqual([])

  await input.fill("md")
  await sidebar.getByRole("button", { name: "Clear title search" }).click()
  await expect(input).toHaveValue("")
  await expect(input).toBeFocused()
  await expect(
    menu.getByRole("button", { name: "Getting Started", exact: true })
  ).toBeVisible()
  await input.fill("nothingmatches")
  await input.press("Escape")
  await expect(input).toHaveValue("")
  await expect(input).toBeFocused()
})

test("category and language changes reset sidebar search; translated config titles are used", async ({
  page,
}) => {
  await page.goto("/docs")
  const sidebar = page.getByRole("complementary", {
    name: "Documentation Navigation",
  })
  const input = sidebar.getByRole("textbox")
  await input.fill("quick")
  await sidebar.getByRole("link", { name: "Components", exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/components$/)
  await expect(input).toHaveValue("")
  await input.fill("Tabs")
  await expect(
    sidebar.locator("[data-slot=scroll-area] nav button:not([aria-expanded])")
  ).toHaveText(["Tabs"])

  await page.getByRole("combobox", { name: "Language", exact: true }).click()
  await page.getByRole("option", { name: "简体中文", exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/zh-CN\/components$/)
  await expect(input).toHaveValue("")
  await expect(input).toHaveAttribute("placeholder", "搜索文章标题…")
  await input.fill("自定义")
  const results = sidebar.locator(
    "[data-slot=scroll-area] nav button:not([aria-expanded])"
  )
  await expect(results).toHaveText(["自定义组件"])
  await input.fill("Customization")
  await expect(sidebar.getByRole("status")).toHaveText("没有找到相关结果。")
  await input.fill("自定义")
  await results.click()
  await expect(page).toHaveURL(/\/docs\/zh-CN\/components\/customization$/)
  await expect(input).toHaveValue("")
  await page.keyboard.press("Control+k")
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(
    page.getByRole("combobox", { name: "搜索文档", exact: true })
  ).toBeFocused()
})

test("sidebar input and footer stay visible while results scroll in both themes", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 280 })
  await page.goto("/docs")
  const sidebar = page.getByRole("complementary", {
    name: "Documentation Navigation",
  })
  const input = sidebar.getByRole("textbox")
  await input.fill("a")
  const viewport = sidebar.locator("[data-slot=scroll-area-viewport]")
  await expect
    .poll(() =>
      viewport.evaluate(
        (element) => element.scrollHeight > element.clientHeight
      )
    )
    .toBeTruthy()
  const initialBounds = await input.boundingBox()
  const last = sidebar
    .locator("[data-slot=scroll-area] nav button:not([aria-expanded])")
    .last()
  await last.focus()
  await expect(last).toBeFocused()
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  expect(await input.boundingBox()).toEqual(initialBounds)
  const footer = await sidebar
    .getByRole("link", { name: "Powered by CodeAltas" })
    .boundingBox()
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(280)
  await page.screenshot({ path: testInfo.outputPath("nav-search-light.png") })
  await page.evaluate(() => document.documentElement.classList.add("dark"))
  await page.screenshot({ path: testInfo.outputPath("nav-search-dark.png") })
})
