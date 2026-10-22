import { test, expect } from "@playwright/test"

test("images open, close on click, restore focus and reset their zoom", async ({
  page,
}) => {
  await page.goto("/docs/components/image")
  const trigger = page
    .getByRole("button", {
      name: "Enlarge image: Code Atlas documentation",
      exact: true,
    })
    .first()
  await trigger.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", {
    name: "Code Atlas documentation",
    exact: true,
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click()
  await expect(dialog.getByRole("status")).toHaveText("125%")
  await dialog.getByRole("img").click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(dialog.getByRole("status")).toHaveText("100%")
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("Ctrl+wheel is canceled only in the open preview and scales the image", async ({
  page,
}) => {
  await page.goto("/docs/components/image")
  await page
    .getByRole("button", {
      name: "Enlarge image: Code Atlas documentation",
      exact: true,
    })
    .first()
    .click()
  const dialog = page.getByRole("dialog", {
    name: "Code Atlas documentation",
    exact: true,
  })
  const viewport = dialog.locator('[data-slot="image-viewport"]')
  const canceled = await viewport.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -200,
      clientX: rect.x + rect.width / 2,
      clientY: rect.y + rect.height / 2,
    })
    element.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(canceled).toBe(true)
  await expect(dialog.getByRole("status")).not.toHaveText("100%")
  expect(
    await viewport.evaluate((element) => {
      const event = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -200,
      })
      element.dispatchEvent(event)
      return event.defaultPrevented
    })
  ).toBe(false)
  await dialog.getByRole("button", { name: "Reset zoom", exact: true }).click()
  await expect(dialog.getByRole("status")).toHaveText("100%")
  const browserZoom = await page.evaluate(() => window.devicePixelRatio)
  await dialog.getByRole("img").hover()
  await page.keyboard.down("Control")
  await page.mouse.wheel(0, -120)
  await page.keyboard.up("Control")
  await expect(dialog.getByRole("status")).not.toHaveText("100%")
  expect(await page.evaluate(() => window.devicePixelRatio)).toBe(browserZoom)
  await viewport.evaluate((element) =>
    element.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        deltaY: -100000,
      })
    )
  )
  await expect(dialog.getByRole("status")).toHaveText("500%")
  await expect(
    dialog.getByRole("button", { name: "Zoom in", exact: true })
  ).toBeDisabled()
  await viewport.evaluate((element) =>
    element.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        deltaY: 100000,
      })
    )
  )
  await expect(dialog.getByRole("status")).toHaveText("25%")
  await expect(
    dialog.getByRole("button", { name: "Zoom out", exact: true })
  ).toBeDisabled()
  await dialog
    .getByRole("button", { name: "Close image preview", exact: true })
    .click()
  expect(
    await page.locator("article").evaluate((element) => {
      const event = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        deltaY: -200,
      })
      element.dispatchEvent(event)
      return event.defaultPrevented
    })
  ).toBe(false)
})

test("dragging a zoomed image does not close the preview; background click does", async ({
  page,
}) => {
  await page.goto("/docs/components/image")
  await page
    .getByRole("button", {
      name: "Enlarge image: Code Atlas documentation",
      exact: true,
    })
    .first()
    .click()
  const dialog = page.getByRole("dialog", {
    name: "Code Atlas documentation",
    exact: true,
  })
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click()
  const image = dialog.getByRole("img")
  const before = await image.evaluate(
    (element) => getComputedStyle(element).transform
  )
  const box = await image.boundingBox()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    box!.x + box!.width / 2 + 60,
    box!.y + box!.height / 2 + 30,
    { steps: 6 }
  )
  await page.mouse.up()
  await expect(dialog).toBeVisible()
  expect(
    await image.evaluate((element) => getComputedStyle(element).transform)
  ).not.toBe(before)
  await dialog
    .locator('[data-slot="image-viewport"]')
    .click({ position: { x: 5, y: 5 } })
  await expect(dialog).toBeHidden()
})

test("the preview fits mobile screens and its controls remain keyboard accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/docs/zh-CN/components/image")
  await page
    .getByRole("button", {
      name: "Enlarge image: Code Atlas 文档界面",
      exact: true,
    })
    .first()
    .click()
  const dialog = page.getByRole("dialog", {
    name: "Code Atlas 文档界面",
    exact: true,
  })
  const box = await dialog.getByRole("img").boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  const close = dialog.getByRole("button", {
    name: "Close image preview",
    exact: true,
  })
  await close.focus()
  await page.keyboard.press("Tab")
  await expect(
    dialog.getByRole("button", { name: "Zoom out", exact: true })
  ).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
})

test("keyboard users can pan to the clipped parts of an enlarged image", async ({
  page,
}) => {
  await page.goto("/docs/components/image")
  await page
    .getByRole("button", {
      name: "Enlarge image: Code Atlas documentation",
      exact: true,
    })
    .first()
    .click()
  const dialog = page.getByRole("dialog", {
    name: "Code Atlas documentation",
    exact: true,
  })
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click()
  const image = dialog.getByRole("img")
  const before = await image.evaluate(
    (element) => getComputedStyle(element).transform
  )
  await page.keyboard.press("ArrowDown")
  const after = await image.evaluate(
    (element) => getComputedStyle(element).transform
  )
  expect(after).not.toBe(before)
  await page.keyboard.press("ArrowUp")
  await expect
    .poll(() =>
      image.evaluate((element) => getComputedStyle(element).transform)
    )
    .toBe(before)
})
