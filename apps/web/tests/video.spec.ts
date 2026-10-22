import { test, expect } from "@playwright/test"

test.setTimeout(60_000)

test("local MP4 playback uses working custom controls", async ({ page }) => {
  await page.goto("/docs/components/video", { waitUntil: "domcontentloaded" })
  const player = page
    .getByRole("region", { name: "Example video", exact: true })
    .first()
  const media = player.locator("video")
  await expect(
    player.getByRole("slider", { name: "Seek", exact: true })
  ).toBeEnabled({ timeout: 15000 })
  expect(
    await media.evaluate((video: HTMLVideoElement) => video.controls)
  ).toBe(false)
  await player.getByRole("button", { name: "Play", exact: true }).click()
  await expect
    .poll(() => media.evaluate((video: HTMLVideoElement) => video.paused))
    .toBe(false)
  await player.getByRole("button", { name: "Pause", exact: true }).click()
  await expect
    .poll(() => media.evaluate((video: HTMLVideoElement) => video.paused))
    .toBe(true)
  await player
    .getByRole("button", { name: "Forward 10 seconds", exact: true })
    .click()
  await expect
    .poll(() => media.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(9)
  await player
    .getByRole("button", { name: "Back 10 seconds", exact: true })
    .click()
  await expect
    .poll(() => media.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeLessThan(2)
  await player.getByRole("button", { name: "Mute", exact: true }).click()
  expect(await media.evaluate((video: HTMLVideoElement) => video.muted)).toBe(
    true
  )
  await player.getByRole("button", { name: "Unmute", exact: true }).click()
  expect(await media.evaluate((video: HTMLVideoElement) => video.muted)).toBe(
    false
  )
  await player
    .getByRole("combobox", { name: "Playback speed", exact: true })
    .click()
  await page.getByRole("option", { name: "1.5×", exact: true }).click()
  expect(
    await media.evaluate((video: HTMLVideoElement) => video.playbackRate)
  ).toBe(1.5)
  const seek = player.getByRole("slider", { name: "Seek", exact: true })
  await seek.focus()
  await page.keyboard.press("End")
  await expect
    .poll(() =>
      media.evaluate((video: HTMLVideoElement) =>
        Math.abs(video.duration - video.currentTime)
      )
    )
    .toBeLessThan(1)
})

test("fullscreen keeps playback and includes the custom toolbar and animated popups", async ({
  page,
}) => {
  await page.goto("/docs/components/video", { waitUntil: "domcontentloaded" })
  const player = page
    .getByRole("region", { name: "Example video", exact: true })
    .first()
  const media = player.locator("video")
  await expect(
    player.getByRole("slider", { name: "Seek", exact: true })
  ).toBeEnabled({ timeout: 15000 })
  await player
    .getByRole("button", { name: "Enter fullscreen", exact: true })
    .click()
  await expect
    .poll(() =>
      player.evaluate((element) => document.fullscreenElement === element)
    )
    .toBe(true)
  const play = player.getByRole("button", { name: "Play", exact: true })
  await play.hover()
  const tooltip = player.getByRole("tooltip")
  await expect(tooltip).toBeVisible()
  expect(
    await tooltip.evaluate(
      (element) => getComputedStyle(element).transitionDuration
    )
  ).not.toBe("0s")
  await player
    .getByRole("combobox", { name: "Playback speed", exact: true })
    .click()
  const listbox = player.getByRole("listbox")
  await expect(listbox).toBeVisible()
  expect(
    await listbox.evaluate(
      (element) => getComputedStyle(element.parentElement!).transitionDuration
    )
  ).not.toBe("0s")
  await page.keyboard.press("Escape")
  await player
    .getByRole("button", { name: "Exit fullscreen", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === null))
    .toBe(true)
  expect(
    await media.evaluate((video: HTMLVideoElement) => video.controls)
  ).toBe(false)
})

test("mobile and reduced-motion controls fit without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/docs/zh-CN/components/video", {
    waitUntil: "domcontentloaded",
  })
  const player = page
    .getByRole("region", { name: "示例视频", exact: true })
    .first()
  await expect(
    player.getByRole("slider", { name: "Seek", exact: true })
  ).toBeEnabled({ timeout: 15000 })
  await player.getByRole("button", { name: "Play", exact: true }).focus()
  await expect(page.getByRole("tooltip")).toBeVisible()
  expect(
    await page
      .getByRole("tooltip")
      .evaluate((element) => getComputedStyle(element).transitionProperty)
  ).toBe("none")
  await expect(
    player.getByRole("slider", { name: "Volume", exact: true })
  ).toBeVisible()
  await player
    .getByRole("combobox", { name: "Playback speed", exact: true })
    .click()
  await expect(page.getByRole("option")).toHaveCount(7)
  for (const option of await page.getByRole("option").all())
    await expect(option).toBeInViewport({ ratio: 1 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
})

test("an absolute remote MP4 URL uses the same custom controls", async ({
  page,
}) => {
  await page.goto("/docs/components/video", { waitUntil: "domcontentloaded" })
  const player = page
    .getByRole("region", { name: "Example video", exact: true })
    .first()
  const media = player.locator("video")
  const remote = new URL("/example.mp4", page.url())
  remote.hostname = "127.0.0.1"
  await media.evaluate((video: HTMLVideoElement, url) => {
    video.src = url
    video.load()
  }, remote.href)
  await expect
    .poll(() => media.evaluate((video: HTMLVideoElement) => video.readyState), {
      timeout: 15000,
    })
    .toBeGreaterThanOrEqual(1)
  expect(
    await media.evaluate((video: HTMLVideoElement) => video.currentSrc)
  ).toBe(remote.href)
  await player.getByRole("button", { name: "Play", exact: true }).click()
  await expect
    .poll(() => media.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(0)
  expect(
    await media.evaluate((video: HTMLVideoElement) => video.controls)
  ).toBe(false)
  const volume = player.getByRole("slider", { name: "Volume", exact: true })
  await volume.focus()
  await page.keyboard.press("Home")
  await expect
    .poll(() => media.evaluate((video: HTMLVideoElement) => video.volume))
    .toBe(0)
  await player.getByRole("button", { name: "Unmute", exact: true }).click()
  await expect
    .poll(() => media.evaluate((video: HTMLVideoElement) => video.volume))
    .toBe(0.5)
})

test("failed media can retry and recover without native controls", async ({
  page,
}) => {
  await page.route("**/example.mp4", (route) => route.abort())
  await page.goto("/docs/components/video", { waitUntil: "domcontentloaded" })
  const player = page
    .getByRole("region", { name: "Example video", exact: true })
    .first()
  await expect(player.getByRole("alert")).toContainText("Unable to load")
  await page.unroute("**/example.mp4")
  await player.getByRole("button", { name: "Retry video", exact: true }).click()
  await expect
    .poll(
      () =>
        player
          .locator("video")
          .evaluate((video: HTMLVideoElement) => video.readyState),
      {
        timeout: 15000,
      }
    )
    .toBeGreaterThanOrEqual(1)
  await expect(player.getByRole("alert")).toBeHidden()
  await expect(
    player.getByRole("button", { name: "Play", exact: true })
  ).toBeEnabled()
})
