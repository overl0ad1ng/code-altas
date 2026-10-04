import { test, expect } from "@playwright/test"

test.use({ viewport: { width: 390, height: 844 } })

test.beforeEach(async ({ page }) => {
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({ json: { stargazers_count: 42 } })
  )
})

test("mobile header opens a menu within the viewport with vertical navigation and footer controls", async ({
  page,
}) => {
  await page.goto("/")
  const header = page.locator("header")
  const menu = header.getByRole("button", { name: "Open menu" })
  await expect(menu).toBeVisible()
  await expect(
    header.getByRole("button", { name: "Search docs", exact: true })
  ).toBeVisible()
  await expect(header.getByRole("navigation")).toBeHidden()
  await expect(header.getByRole("button", { name: /^Switch to/ })).toBeHidden()
  await menu.click()
  const drawer = page.getByRole("dialog", { name: "Open menu" })
  await expect(drawer).toBeVisible()
  await expect(drawer).toHaveAttribute("data-swipe-direction", "left")
  await expect
    .poll(async () => {
      const box = await drawer.boundingBox()
      return (
        box &&
        box.x >= 0 &&
        box.y >= 0 &&
        box.width > 0 &&
        box.x + box.width <= 390 &&
        box.y + box.height <= 844
      )
    })
    .toBe(true)
  const menuBounds = (await drawer.boundingBox())!
  expect(menuBounds.x).toBeGreaterThanOrEqual(0)
  expect(menuBounds.y).toBeGreaterThanOrEqual(0)
  expect(menuBounds.x + menuBounds.width).toBeLessThanOrEqual(390)
  expect(menuBounds.y + menuBounds.height).toBeLessThanOrEqual(844)
  const docs = drawer.getByRole("link", { name: "Docs", exact: true })
  const changelog = drawer.getByRole("link", { name: "Changelog", exact: true })
  await expect(docs).toBeVisible()
  const docsBox = await docs.boundingBox()
  const logBox = await changelog.boundingBox()
  expect(logBox!.y).toBeGreaterThan(docsBox!.y)
  await expect(drawer.locator("nav > span[aria-hidden=true]")).toHaveCount(0)
  await expect(
    drawer.getByRole("link", { name: /GitHub:.*42 stars/ })
  ).toBeVisible()
  const theme = drawer.getByRole("button", { name: /^Switch to/ })
  const previousTheme = await page.locator("html").getAttribute("class")
  await theme.click()
  await expect(drawer).toBeVisible()
  await expect
    .poll(() => page.locator("html").getAttribute("class"))
    .not.toBe(previousTheme)
  await expect(drawer.getByRole("combobox", { name: "Language" })).toBeVisible()
  await drawer.getByRole("button", { name: "Close menu" }).click()
  await expect(drawer).toHaveCount(0)
  await expect(menu).toBeFocused()
})

test("drawer search hands off to one search dialog and restores focus to the header icon", async ({
  page,
}) => {
  await page.goto("/")
  const header = page.locator("header")
  await header.getByRole("button", { name: "Open menu" }).click()
  await page
    .getByRole("dialog", { name: "Open menu" })
    .getByRole("button", { name: "Search docs", exact: true })
    .click()
  const search = page.getByRole("dialog", { name: "Search docs", exact: true })
  await expect(search).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(1)
  const input = search.getByRole("combobox", {
    name: "Search docs",
    exact: true,
  })
  await expect(input).toBeFocused()
  await input.fill("frontmatter")
  await expect(search.getByRole("option").first()).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(
    header.getByRole("button", { name: "Search docs", exact: true })
  ).toBeFocused()
  await header.getByRole("button", { name: "Open menu" }).click()
  await page.keyboard.press("Control+k")
  await expect(search).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(1)
  await page.keyboard.press("Control+k")
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("active navigation, language changes, Escape and desktop resizing dismiss the menu", async ({
  page,
}) => {
  await page.goto("/docs")
  const menu = page.locator("header").getByRole("button", { name: "Open menu" })
  await menu.click()
  const drawer = page.getByRole("dialog", { name: "Open menu" })
  await expect(
    drawer.getByRole("link", { name: "Docs", exact: true })
  ).toHaveAttribute("aria-current", "page")
  await drawer.getByRole("combobox", { name: "Language" }).click()
  await page.getByRole("option", { name: "简体中文" }).click()
  await expect(page).toHaveURL(/\/docs\/zh-CN$/)
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.locator("header").getByRole("button", { name: "打开菜单" }).click()
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "Docs", exact: true })
  ).toHaveAttribute("href", "/docs/zh-CN")
  await page.keyboard.press("Escape")
  await expect(
    page.locator("header").getByRole("button", { name: "打开菜单" })
  ).toBeFocused()
  await page.locator("header").getByRole("button", { name: "打开菜单" }).click()
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Changelog", exact: true })
    .click()
  await expect(page).toHaveURL(/\/changelog$/)
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page
    .locator("header")
    .getByRole("button", { name: "Open menu" })
    .click()
  await page.setViewportSize({ width: 768, height: 844 })
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.locator("header").getByRole("navigation")).toBeVisible()
  await expect(
    page.locator("header").getByRole("button", { name: "Open menu" })
  ).toBeHidden()
})

test("menu fits intermediate widths, short screens and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 767, height: 320 })
  await page.goto("/")
  await page
    .locator("header")
    .getByRole("button", { name: "Open menu" })
    .click()
  const drawer = page.getByRole("dialog", { name: "Open menu" })
  await expect(drawer).toBeVisible()
  await expect
    .poll(async () => Math.round((await drawer.boundingBox())!.width))
    .toBeLessThanOrEqual(767)
  await drawer
    .getByRole("button", { name: /^Switch to/ })
    .scrollIntoViewIfNeeded()
  await expect(
    drawer.getByRole("button", { name: /^Switch to/ })
  ).toBeInViewport()
  await expect
    .poll(() => drawer.evaluate((el) => el.scrollWidth <= el.clientWidth))
    .toBe(true)
  await page.keyboard.press("Escape")
  await expect(drawer).toHaveCount(0)
})
