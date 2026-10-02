import assert from "node:assert/strict"
import test from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { fsCache: false })
const { createTocTrack } = await jiti.import("../src/lib/toc-track.ts")

test("depth changes use rounded diagonal joins and active ranges leave room at both ends", () => {
  const track = createTocTrack([
    { id: "first", depth: 2, top: 0, height: 36 },
    { id: "wrapped", depth: 3, top: 36, height: 56 },
    { id: "last", depth: 2, top: 92, height: 36 },
  ])
  assert.match(track.path, /^M 1 0 L 1 27 Q 1 30 /)
  assert.equal((track.path.match(/ Q /g) ?? []).length, 4)
  assert.match(track.path, /Q 13 42 13 45 L 13 83 Q 13 86 /)
  assert.deepEqual(track.ranges.first, { start: 3, end: 24 })
  assert.ok(
    Math.abs(track.ranges.wrapped.end - track.ranges.wrapped.start - 32) < 0.001
  )
  assert.ok(track.ranges.wrapped.start > track.ranges.first.end)
  assert.ok(track.ranges.last.start > track.ranges.wrapped.end)
  assert.ok(Math.abs(track.ranges.last.end - (track.length - 3)) < 0.001)
})

test("same-depth rows remain continuous and skipped depths retain their indentation", () => {
  const track = createTocTrack([
    { id: "one", depth: 2, top: 0, height: 36 },
    { id: "two", depth: 2, top: 36, height: 36 },
    { id: "__proto__", depth: 6, top: 72, height: 36 },
  ])
  assert.match(track.path, /^M 1 0 L 1 36 L 1 63 Q 1 66 /)
  assert.match(track.path, /Q 49 78 49 81 L 49 108$/)
  assert.deepEqual(track.ranges.one, { start: 3, end: 33 })
  assert.equal(track.ranges.two.start, 39)
  assert.equal(track.ranges.two.end, 60)
  assert.ok(Math.abs(track.ranges.__proto__.end - (track.length - 3)) < 0.001)
  assert.deepEqual(createTocTrack([]), {
    path: "",
    length: 0,
    ranges: Object.create(null),
  })
})
