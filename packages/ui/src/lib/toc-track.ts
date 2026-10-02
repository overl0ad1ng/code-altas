export interface TocTrackRow {
  id: string
  depth: number
  top: number
  height: number
}

export interface TocTrackRange {
  start: number
  end: number
}

interface Point {
  x: number
  y: number
}

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y)

// Simpson integration keeps dash distances aligned with the SVG's curved path.
function curveLength(start: Point, control: Point, end: Point) {
  const steps = 24
  let sum = 0
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const speed =
      2 *
      Math.hypot(
        (1 - t) * (control.x - start.x) + t * (end.x - control.x),
        (1 - t) * (control.y - start.y) + t * (end.y - control.y)
      )
    sum += speed * (i === 0 || i === steps ? 1 : i % 2 === 0 ? 2 : 4)
  }
  return sum / (3 * steps)
}

/** One rounded track and shorter active intervals measured along that track. */
export function createTocTrack(rows: TocTrackRow[]) {
  let path = ""
  let length = 0
  const ranges: Record<string, TocTrackRange> = Object.create(null)
  const points: Point[] = []
  const rowPoints: { start: number; end: number }[] = []

  function point(x: number, y: number): number {
    const last = points.at(-1)
    if (!last || last.x !== x || last.y !== y) points.push({ x, y })
    return points.length - 1
  }

  rows.forEach((row, index) => {
    const x = (row.depth - 2) * 12 + 1
    const before = rows[index - 1]
    const after = rows[index + 1]
    // Each join spans both sides of the row boundary, never a horizontal step.
    const start =
      row.top +
      (before && before.depth !== row.depth ? Math.min(6, row.height / 4) : 0)
    const end =
      row.top +
      row.height -
      (after && after.depth !== row.depth ? Math.min(6, row.height / 4) : 0)
    rowPoints.push({ start: point(x, start), end: point(x, end) })
  })

  const beforeDistances: number[] = []
  const afterDistances: number[] = []
  let previous = points[0]
  if (previous) path = `M ${previous.x} ${previous.y}`
  points.forEach((current, index) => {
    const before = points[index - 1]
    const after = points[index + 1]
    let entry = current
    let exit = current
    if (before && after) {
      const incoming = distance(before, current)
      const outgoing = distance(current, after)
      const cross =
        (current.x - before.x) * (after.y - current.y) -
        (current.y - before.y) * (after.x - current.x)
      if (Math.abs(cross) > 0.001) {
        const radius = Math.min(3, incoming / 2, outgoing / 2)
        entry = {
          x: current.x - ((current.x - before.x) * radius) / incoming,
          y: current.y - ((current.y - before.y) * radius) / incoming,
        }
        exit = {
          x: current.x + ((after.x - current.x) * radius) / outgoing,
          y: current.y + ((after.y - current.y) * radius) / outgoing,
        }
      }
    }
    if (index > 0) {
      path += ` L ${entry.x} ${entry.y}`
      length += distance(previous!, entry)
    }
    beforeDistances[index] = length
    if (entry !== exit) {
      path += ` Q ${current.x} ${current.y} ${exit.x} ${exit.y}`
      length += curveLength(entry, current, exit)
    }
    afterDistances[index] = length
    previous = exit
  })

  rows.forEach((row, index) => {
    const indices = rowPoints[index]!
    const start = afterDistances[indices.start]!
    const end = beforeDistances[indices.end]!
    // Keep round orange caps away from the rounded diagonal joins at rest.
    const inset = Math.min(3, (end - start) / 4)
    ranges[row.id] = { start: start + inset, end: end - inset }
  })

  return { path, length, ranges }
}
