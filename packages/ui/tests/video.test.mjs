import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import { createJiti } from "jiti"
import { fileURLToPath } from "node:url"
import { readFile } from "node:fs/promises"

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  fsCache: false,
  alias: {
    "server-only": fileURLToPath(new URL("./server-only.mjs", import.meta.url)),
  },
})
const { renderDoc } = await jiti.import("../src/server/render-doc.tsx")

async function render(content) {
  const result = await renderDoc({
    content,
    extension: ".mdx",
    slug: "/video",
    title: "Video",
  })
  return renderToStaticMarkup(result.content)
}

test("Video is registered in MDX with custom playback, seek, volume, speed and fullscreen controls", async () => {
  const html = await render(
    '<Video src="/example.mp4" title="Demo" caption="An example recording" />'
  )
  assert.match(html, /<video[^>]+src="\/example.mp4"/)
  assert.doesNotMatch(html, /<video[^>]*\scontrols(?:=|\s|>)/)
  for (const label of [
    "Play",
    "Back 10 seconds",
    "Forward 10 seconds",
    "Mute",
    "Playback speed",
    "Enter fullscreen",
  ]) {
    assert.ok(html.includes(`aria-label="${label}"`), label)
  }
  assert.match(html, /An example recording/)
  assert.match(html, /preload="metadata"/)
  assert.match(html, /playsInline=""/i)
})

test("remote MP4 URLs and native poster, loop and muted attributes reach the video", async () => {
  const html = await render(
    '<Video src="https://cdn.example.com/demo.mp4?token=example" poster="/poster.png" loop muted />'
  )
  assert.match(html, /src="https:\/\/cdn.example.com\/demo.mp4\?token=example"/)
  assert.match(html, /poster="\/poster.png"/)
  assert.match(html, /loop=""/)
  assert.match(html, /muted=""/)
  assert.match(html, /aria-label="Unmute"/)
})

test("native controls cannot replace the custom toolbar through MDX props", async () => {
  const html = await render('<Video src="/example.mp4" controls />')
  assert.doesNotMatch(html, /<video[^>]*\scontrols(?:=|\s|>)/)
  assert.match(html, /data-slot="video-controls"/)
})

for (const language of ["", ".zh-CN"]) {
  test(`Video ${language || "English"} documentation renders with its demo and property table`, async () => {
    const content = await readFile(
      new URL(
        `../../../apps/web/content/components/video${language}.mdx`,
        import.meta.url
      ),
      "utf8"
    )
    const result = await renderDoc(
      { content, extension: ".mdx", slug: "/components/video", title: "Video" },
      undefined,
      { experimentalComponentsInMDX: true }
    )
    const html = renderToStaticMarkup(result.content)
    assert.match(html, /data-slot="video-controls"/)
    assert.match(html, /data-slot="video-caption"/)
    assert.match(html, /role="tabpanel"/)
    assert.match(html, /<table/)
  })
}
