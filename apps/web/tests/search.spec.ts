import { test, expect } from "@playwright/test"

test("entry is docs-only; shortcut, selection, highlights and navigation work", async ({
  page,
  request,
}) => {
  await page.goto("/")
  await expect(
    page.getByRole("button", { name: "Search docs", exact: true })
  ).toHaveCount(0)
  await page.goto("/docs")
  await expect(page.getByRole("button", { name: /^Switch to/ })).toBeEnabled()
  await page.getByRole("button", { name: "Search docs", exact: true }).waitFor()
  await page.keyboard.press("Control+k")
  const input = page.getByRole("combobox", { name: "Search docs", exact: true })
  await expect(input).toBeFocused()
  await input.fill("frontmatter")
  await expect(page.getByRole("option").first()).toBeVisible()
  await expect(page.locator("mark").first()).toBeVisible()
  const response = await request.get("/api/search?q=frontmatter&locale=en")
  const { results } = await response.json()
  await input.press("ArrowDown")
  await expect(page.getByRole("option").nth(1)).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await input.press("Enter")
  await expect(page).toHaveURL(`http://localhost:3100${results[1].url}`)
  const hash = new URL(results[1].url, "http://localhost:3100").hash
  if (hash) {
    await expect(
      page.locator(`[id=${JSON.stringify(decodeURIComponent(hash.slice(1)))}]`)
    ).toBeVisible()
  }
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("single-character hints, empty results, escape and focus restoration", async ({
  page,
}) => {
  await page.goto("/docs")
  const trigger = page.getByRole("button", { name: "Search docs", exact: true })
  await trigger.click()
  const input = page.getByRole("combobox", { name: "Search docs", exact: true })
  await input.fill("a")
  await expect(
    page.getByText(
      "Searching titles and headings. Type more to search full text."
    )
  ).toBeVisible()
  await input.fill("zzzznothingmatches")
  await expect(page.getByText("No results found.")).toBeVisible()
  await input.press("Escape")
  await expect(trigger).toBeFocused()
})

test("failed queries can be retried and delayed responses cannot overwrite newer input", async ({
  page,
}) => {
  await page.route(
    "**/api/search?**",
    (route) => route.fulfill({ status: 503, json: { error: "Test failure" } }),
    { times: 1 }
  )
  await page.goto("/docs")
  await page.getByRole("button", { name: "Search docs", exact: true }).click()
  const input = page.getByRole("combobox", { name: "Search docs", exact: true })
  await input.fill("frontmatter")
  await expect(
    page.getByText("Search is unavailable. Please try again.")
  ).toBeVisible()
  await page.getByRole("button", { name: "Retry", exact: true }).click()
  await expect(page.getByRole("option").first()).toBeVisible()
  await page.route("**/api/search?**", async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("q") === "configuration"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    await route.continue()
  })
  const pending = page.waitForRequest(
    (request) =>
      new URL(request.url()).searchParams.get("q") === "configuration"
  )
  await input.fill("configuration")
  await pending
  await input.fill("zzzznothingmatches")
  await expect(page.getByText("No results found.")).toBeVisible()
  await page.waitForTimeout(1200)
  await expect(page.getByRole("option")).toHaveCount(0)
})

test("locale changes reset the dialog and search only the selected language", async ({
  page,
  request,
}) => {
  await page.goto("/docs")
  await page.getByRole("button", { name: "Search docs", exact: true }).click()
  await page
    .getByRole("combobox", { name: "Search docs", exact: true })
    .fill("frontmatter")
  await expect(page.getByRole("option").first()).toBeVisible()
  await page.getByRole("button", { name: "Close search", exact: true }).click()
  await page.getByRole("combobox", { name: "Language", exact: true }).click()
  await page.getByRole("option", { name: "简体中文", exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/zh-CN/)
  await page.getByRole("button", { name: "搜索文档", exact: true }).click()
  const input = page.getByRole("combobox", { name: "搜索文档", exact: true })
  await expect(input).toHaveValue("")
  await input.fill("配置")
  await expect(page.getByRole("option").first()).toBeVisible()
  const response = await request.get("/api/search?q=配置&locale=zh-CN")
  const { results } = await response.json()
  expect(
    results.every((result: { url: string }) =>
      result.url.startsWith("/docs/zh-CN")
    )
  ).toBeTruthy()
})

test("dialog fits narrow screens and both themes", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/docs/zh-CN")
  await expect(page.getByRole("button", { name: /^Switch to/ })).toBeEnabled()
  const trigger = page.getByRole("button", { name: "搜索文档", exact: true })
  const triggerBounds = await trigger.boundingBox()
  expect(
    (triggerBounds?.x ?? 0) + (triggerBounds?.width ?? 0)
  ).toBeLessThanOrEqual(390)
  await page.keyboard.press("Control+k")
  const input = page.getByRole("combobox", { name: "搜索文档", exact: true })
  await expect(
    page.getByRole("status").getByText("搜索标题、小标题、正文和代码。")
  ).toBeVisible()
  await page.waitForTimeout(180)
  await page.screenshot({
    path: testInfo.outputPath("search-mobile-empty.png"),
  })
  await input.fill("配置")
  await expect(page.getByRole("option").first()).toBeVisible()
  const dialog = page.getByRole("dialog")
  const bounds = await dialog.boundingBox()
  expect(bounds?.x).toBeGreaterThanOrEqual(0)
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(390)
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(844)
  await page.screenshot({
    path: testInfo.outputPath("search-mobile-light.png"),
  })
  await page.evaluate(() => document.documentElement.classList.add("dark"))
  await page.waitForTimeout(200)
  await page.screenshot({ path: testInfo.outputPath("search-mobile-dark.png") })
  await page.route("**/api/search?**", (route) =>
    route.fulfill({
      json: {
        results: Array.from({ length: 20 }, (_, index) => ({
          id: String(index),
          title: `滚动结果 ${index + 1}`,
          url: "/docs/zh-CN",
          type: "text",
          snippet: "搜索配置的示例正文，检查长列表的滚动和键盘导航。",
          highlights: [{ start: 2, end: 4 }],
        })),
      },
    })
  )
  await input.fill("滚动")
  await expect(page.getByRole("option")).toHaveCount(20)
  const viewport = dialog.locator(
    "[data-search-body] [data-slot=scroll-area-viewport]"
  )
  await expect
    .poll(() =>
      viewport.evaluate(
        (element) => element.scrollHeight > element.clientHeight
      )
    )
    .toBeTruthy()
  // ArrowUp wraps from the first result to the last, scrolling the custom viewport.
  await input.press("ArrowUp")
  await expect(page.getByRole("option").last()).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
})
