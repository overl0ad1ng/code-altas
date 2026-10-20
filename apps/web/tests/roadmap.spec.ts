import { mkdir, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { test, expect } from "@playwright/test"

const fixtureDirectory = resolve("content/_roadmap_/999_0_0")
let fixtureCreated = false
const preview =
  "Every release should explain what we are building, why it matters, and how contributors can help. Keep the preview readable while the detail dialog preserves the complete plan. ".repeat(
    7
  )

test.beforeAll(async () => {
  // Exclusive creation protects an author's existing version.
  await mkdir(fixtureDirectory)
  fixtureCreated = true
  await writeFile(
    resolve(fixtureDirectory, "roadmap.toml"),
    `title = "Browser test release"
goal = "Verify the complete planning board"
[[groups]]
id = "quality"
title = "Quality"
${["content", "search", "navigation", "tooling", "release"].map((id) => `[[groups]]\nid = "${id}"\ntitle = "${id}"`).join("\n")}
[[statuses]]
id = "verified"
title = "Verified"
`
  )
  for (let index = 0; index < 10; index++) {
    await writeFile(
      resolve(fixtureDirectory, `item-${index}.mdx`),
      `---
title: ${index === 0 ? "Keyboard interaction" : `Additional item ${index}`}
description: Inspect the full plan and its properties.
group: quality
status: verified
priority: High
due: "2026-11-15"
assignees: [octocat, 583231]
properties:
  Area: Quality assurance
  Estimate: 3 days
order: ${index}
---

${preview}

## Acceptance criteria

- [x] A complete plan is available in the dialog.

<Hint type="info"><HintContent>Rich MDX content belongs in the dialog.</HintContent></Hint>
`
    )
  }
})

test.afterAll(async () => {
  if (
    fixtureCreated &&
    fixtureDirectory === resolve("content/_roadmap_/999_0_0")
  ) {
    await rm(fixtureDirectory, { recursive: true, force: true })
  }
})

test.beforeEach(async ({ page }) => {
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({ json: { stargazers_count: 42 } })
  )
  await page.route(
    /https:\/\/(?:github\.com\/[^/]+\.png|avatars\.githubusercontent\.com\/u\/)/,
    (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="#64748b"/></svg>',
      })
  )
})

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`board, dialogs and version selector work at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto("/roadmap", { waitUntil: "domcontentloaded" })
    await expect(
      page.getByRole("heading", { name: "Browser test release", exact: true })
    ).toBeVisible()
    const board = page.getByRole("region", {
      name: "Roadmap board",
      exact: true,
    })
    await expect(page.locator('[data-slot="roadmap-column"]')).toHaveCount(6)
    expect(
      await board.evaluate(
        (element) => element.scrollWidth > element.clientWidth
      )
    ).toBe(true)
    const column = page.locator('[data-slot="roadmap-column"]').first()
    expect((await column.boundingBox())!.width).toBeCloseTo(350, 0)
    expect(
      await column
        .locator("div")
        .first()
        .evaluate((element) => element.scrollHeight > element.clientHeight)
    ).toBe(true)
    const bounds = await page.locator("main").boundingBox()
    expect(bounds!.y).toBe(56)
    expect(bounds!.height).toBeCloseTo(viewport.height - 56, 0)
    expect(bounds!.width).toBe(viewport.width)
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight
      )
    ).toBe(true)
    const card = page.getByRole("button", {
      name: "View Keyboard interaction",
      exact: true,
    })
    const cardPreview = card.locator('[data-slot="roadmap-preview"]')
    expect(
      await cardPreview.evaluate((element) => element.clientHeight)
    ).toBeLessThanOrEqual(96)
    await expect(
      card.locator('[data-slot="roadmap-preview-fade"]')
    ).toHaveCount(1)
    await expect(
      card.getByRole("img", { name: "@octocat", exact: true })
    ).toHaveAttribute("src", /github.com\/octocat.png/)
    await card.focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog", {
      name: "Keyboard interaction",
      exact: true,
    })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole("heading", { name: "Acceptance criteria", exact: true })
    ).toBeVisible()
    await expect(
      dialog.getByText("Rich MDX content belongs in the dialog.", {
        exact: true,
      })
    ).toBeVisible()
    const details = dialog.getByRole("complementary", {
      name: "Item details",
      exact: true,
    })
    await expect(details.getByText("High", { exact: true })).toBeAttached()
    await expect(
      details.getByText("Nov 15, 2026", { exact: true })
    ).toBeAttached()
    await expect(
      details.getByText("Quality assurance", { exact: true })
    ).toBeAttached()
    await expect(
      details.getByRole("link", { name: "@octocat", exact: true })
    ).toHaveAttribute("href", "https://github.com/octocat")
    await expect(
      dialog.getByRole("checkbox", { name: "Completed task", exact: true })
    ).toBeChecked()
    if (viewport.width >= 768) {
      expect((await details.boundingBox())!.x).toBeGreaterThan(
        (await dialog.locator("article").boundingBox())!.x
      )
    }
    await page.keyboard.press("Tab")
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement)
      )
    ).toBe(true)
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(card).toBeFocused()
    const requests: string[] = []
    page.on("request", (request) => {
      const url = new URL(request.url())
      if (
        url.pathname === "/roadmap" &&
        (request.resourceType() === "document" || url.searchParams.has("_rsc"))
      )
        requests.push(request.url())
    })
    const version = page.getByRole("combobox", { name: "Version", exact: true })
    await version.click()
    await page.getByRole("option", { name: "v0.1.0", exact: true }).click()
    await expect(
      page.getByRole("heading", { name: "The road to 0.1.0", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /^Content\s*\(?2\)?$/ })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /^Experience\s*\(?2\)?$/ })
    ).toBeAttached()
    await expect(
      page.getByRole("button", {
        name: "View Keyboard interaction",
        exact: true,
      })
    ).toHaveCount(0)
    expect(requests).toEqual([])
    if (viewport.width >= 768) {
      const columns = page.locator('[data-slot="roadmap-column"]')
      const first = (await columns.first().boundingBox())!
      const last = (await columns.last().boundingBox())!
      expect((first.x + last.x + last.width) / 2).toBeCloseTo(
        viewport.width / 2,
        0
      )
    }
    await page
      .getByRole("button", { name: "View Local-first planning", exact: true })
      .click()
    await expect(
      page
        .getByRole("dialog")
        .getByText(
          "Keep these examples or replace them with your own release plans.",
          { exact: true }
        )
    ).toBeVisible()
    await page
      .getByRole("button", { name: "Close item details", exact: true })
      .click()
    await version.focus()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Home")
    await page.keyboard.press("Enter")
    await expect(
      page.getByRole("heading", { name: "Browser test release", exact: true })
    ).toBeVisible()
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(version).toHaveText("v999.0.0")
    expect(errors).toEqual([])
  })
}

test("GitHub avatars keep a named fallback when an image fails", async ({
  page,
}) => {
  await page.route(/github\.com\/octocat\.png/, (route) => route.abort())
  await page.goto("/roadmap", { waitUntil: "domcontentloaded" })
  const card = page.getByRole("button", {
    name: "View Keyboard interaction",
    exact: true,
  })
  await card.scrollIntoViewIfNeeded()
  await expect(
    card.getByRole("img", { name: "@octocat", exact: true })
  ).toHaveJSProperty("tagName", "SPAN")
})
