import { test, expect } from "@playwright/test"

test.use({ viewport: { width: 390, height: 844 } })

test("mobile docs use full-width content and a directory with category Select", async ({
  page,
}) => {
  await page.goto("/docs")
  await expect(
    page.getByRole("complementary", { name: "Documentation Navigation" })
  ).toBeHidden()
  const article = page.locator("article[data-doc-slug]")
  const articleBox = await article.boundingBox()
  expect(articleBox!.x).toBe(0)
  expect(articleBox!.width).toBe(390)
  expect(articleBox!.y).toBeGreaterThanOrEqual(100)
  await page
    .getByRole("button", { name: "Documentation menu", exact: true })
    .click()
  const drawer = page.getByRole("dialog", {
    name: "Documentation menu",
    exact: true,
  })
  await expect
    .poll(async () => {
      const box = await drawer.boundingBox()
      return (
        box &&
        box.x >= 0 &&
        box.y >= 0 &&
        box.width > 0 &&
        box.height > 0 &&
        box.x + box.width <= 391 &&
        box.y + box.height <= 845
      )
    })
    .toBe(true)
  const select = drawer.getByRole("combobox", { name: "Select category" })
  await expect(select).toContainText("Getting Started")
  await expect(select.locator("svg")).toHaveCount(2)
  await expect(
    drawer.locator('[data-slot="docs-category-indicator"]')
  ).toHaveCount(0)
  await select.click()
  const option = page.getByRole("option", { name: "Components", exact: true })
  await expect(option.locator("svg").first()).toBeVisible()
  await option.click()
  await expect(page).toHaveURL(/\/docs\/components$/)
  await expect(drawer).toBeVisible()
  await expect(select).toContainText("Components")
  const input = drawer.getByRole("textbox", { name: "Search article titles…" })
  await input.fill("Tabs")
  await drawer.getByRole("button", { name: "Tabs", exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/components\/tabs$/)
  await expect(drawer).toHaveCount(0)
  await page
    .getByRole("button", { name: "Documentation menu", exact: true })
    .click()
  await expect(input).toHaveValue("")
  await expect(
    drawer.getByRole("button", { name: "Tabs", exact: true })
  ).toHaveAttribute("aria-current", "true")
  await drawer.getByRole("button", { name: "Tabs", exact: true }).click()
  await expect(drawer).toHaveCount(0)
})

test("directory supports translated categories, Escape, focus restoration and search handoff", async ({
  page,
}) => {
  await page.goto("/docs/zh-CN")
  const trigger = page.getByRole("button", { name: "文档目录", exact: true })
  await trigger.click()
  const drawer = page.getByRole("dialog", { name: "文档目录", exact: true })
  await expect(
    drawer.getByRole("combobox", { name: "选择分类" })
  ).toContainText("开始使用")
  const input = drawer.getByRole("textbox", { name: "搜索文章标题…" })
  await input.fill("不存在的文章")
  await expect(drawer.getByRole("status")).toHaveText("没有找到相关结果。")
  await input.press("Escape")
  await expect(input).toHaveValue("")
  await expect(drawer).toBeVisible()
  await input.press("Escape")
  await expect(drawer).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.keyboard.press("Control+k")
  const search = page.getByRole("dialog", { name: "搜索文档", exact: true })
  await expect(search).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(1)
  await expect(
    search.getByRole("combobox", { name: "搜索文档", exact: true })
  ).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(
    page
      .locator("header")
      .getByRole("button", { name: "搜索文档", exact: true })
  ).toBeFocused()
})

test("short-screen lists scroll independently and desktop resizing restores the sidebar", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 767, height: 400 })
  await page.goto("/docs")
  await page
    .getByRole("button", { name: "Documentation menu", exact: true })
    .click()
  const drawer = page.getByRole("dialog", {
    name: "Documentation menu",
    exact: true,
  })
  await drawer.getByRole("textbox").fill("a")
  const viewport = drawer.locator('[data-slot="scroll-area-viewport"]')
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollHeight > el.clientHeight))
    .toBe(true)
  await expect(drawer.getByRole("textbox")).toBeInViewport()
  await expect(
    drawer.getByRole("link", { name: "Powered by CodeAltas" })
  ).toBeInViewport()
  await page.setViewportSize({ width: 768, height: 844 })
  await expect(drawer).toHaveCount(0)
  const sidebar = page.getByRole("complementary", {
    name: "Documentation Navigation",
  })
  await expect(sidebar).toBeVisible()
  await expect(
    sidebar.getByRole("link", { name: "Getting Started", exact: true })
  ).toBeVisible()
  await expect(
    sidebar.locator('[data-slot="docs-category-select"]')
  ).toHaveCount(0)
  expect((await page.locator("article[data-doc-slug]").boundingBox())!.x).toBe(
    256
  )
})
