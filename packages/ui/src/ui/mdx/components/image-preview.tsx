"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Minus, Plus, RotateCcw, X } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react"

import type { ImageProps } from "./image"

type Transform = { scale: number; x: number; y: number }
type Drag = {
  pointerId: number
  startX: number
  startY: number
  x: number
  y: number
  moved: boolean
}
const INITIAL_TRANSFORM: Transform = { scale: 1, x: 0, y: 0 }
const MIN_SCALE = 0.25
const MAX_SCALE = 5
const ZOOM_STEP = 0.25
const PAN_STEP = 50
const controlClassName =
  "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-40"

export function ImagePreview({
  caption,
  onClose,
  ...props
}: Pick<
  ImageProps,
  | "src"
  | "srcSet"
  | "sizes"
  | "alt"
  | "crossOrigin"
  | "referrerPolicy"
  | "caption"
> & { onClose: () => void }) {
  const [transform, setTransform] = useState(INITIAL_TRANSFORM)
  const [failed, setFailed] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<Drag | null>(null)

  function zoom(scale: number) {
    setTransform((current) =>
      constrain({ ...current, scale }, canvasRef.current, imageRef.current)
    )
  }

  useEffect(() => {
    const viewport = viewportRef.current
    const canvas = canvasRef.current
    if (!viewport || !canvas) return

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey) return
      // React's delegated wheel listeners are passive; this listener must cancel browser zoom.
      event.preventDefault()
      const rect = canvas!.getBoundingClientRect()
      const pointerX = event.clientX - rect.left - rect.width / 2
      const pointerY = event.clientY - rect.top - rect.height / 2
      const pixels =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1)

      setTransform((current) => {
        const scale = clamp(
          current.scale * Math.exp(-pixels * 0.002),
          MIN_SCALE,
          MAX_SCALE
        )

        const ratio = scale / current.scale

        return constrain(
          {
            scale,
            x: pointerX - (pointerX - current.x) * ratio,
            y: pointerY - (pointerY - current.y) * ratio,
          },
          canvas,
          imageRef.current
        )
      })
    }

    viewport.addEventListener("wheel", onWheel, { passive: false })

    const observer = new ResizeObserver(() => {
      setTransform((current) => constrain(current, canvas, imageRef.current))
    })

    observer.observe(canvas)

    return () => {
      viewport.removeEventListener("wheel", onWheel)
      observer.disconnect()
    }
  }, [])

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary) return

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: transform.x,
      y: transform.y,
      moved: false,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) return

    const x = event.clientX - drag.startX
    const y = event.clientY - drag.startY

    if (Math.hypot(x, y) > 5) {
      drag.moved = true
    }

    if (!drag.moved || transform.scale <= 1) return

    setTransform((current) =>
      constrain(
        { ...current, x: drag.x + x, y: drag.y + y },
        canvasRef.current,
        imageRef.current
      )
    )
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return

    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function closeOnClick() {
    const dragged = dragRef.current?.moved
    dragRef.current = null

    if (!dragged) {
      onClose()
    }
  }

  function panWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey || transform.scale <= 1) {
      return
    }

    const directions: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: PAN_STEP, y: 0 },
      ArrowRight: { x: -PAN_STEP, y: 0 },
      ArrowUp: { x: 0, y: PAN_STEP },
      ArrowDown: { x: 0, y: -PAN_STEP },
    }

    const direction = directions[event.key]

    if (!direction) return

    event.preventDefault()
    setTransform((current) =>
      constrain(
        { ...current, x: current.x + direction.x, y: current.y + direction.y },
        canvasRef.current,
        imageRef.current
      )
    )
  }

  return (
    <div
      ref={viewportRef}
      data-slot="image-viewport"
      className="flex h-full w-full flex-col"
      onClick={closeOnClick}
      onKeyDown={panWithKeyboard}
    >
      <div className="relative z-10 flex shrink-0 justify-end gap-1 p-1 sm:p-4">
        <div
          role="group"
          aria-label="Image zoom controls"
          className="flex items-center gap-1 rounded-xl bg-black/50 p-1 backdrop-blur-sm"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            className={controlClassName}
            disabled={transform.scale <= MIN_SCALE}
            onClick={() => zoom(transform.scale - ZOOM_STEP)}
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span
            role="status"
            aria-label="Image zoom"
            className="w-14 select-none text-center text-sm tabular-nums"
          >
            {Math.round(transform.scale * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            className={controlClassName}
            disabled={transform.scale >= MAX_SCALE}
            onClick={() => zoom(transform.scale + ZOOM_STEP)}
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Reset zoom"
            title="Reset zoom"
            className={controlClassName}
            onClick={() => setTransform(INITIAL_TRANSFORM)}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="rounded-xl p-1 bg-black/50 backdrop-blur-sm">
          <Dialog.Close
            aria-label="Close image preview"
            title="Close image preview"
            className={`${controlClassName} self-center`}
            onClick={(event) => event.stopPropagation()}
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
        </div>
      </div>
      <div
        ref={canvasRef}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => {
          dragRef.current = null
        }}
      >
        <img
          {...props}
          ref={imageRef}
          draggable={false}
          onError={() => setFailed(true)}
          className={
            transform.scale > 1
              ? "max-h-full max-w-full cursor-grab object-contain select-none active:cursor-grabbing"
              : "max-h-full max-w-full cursor-zoom-out object-contain select-none"
          }
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        />
        {failed && (
          <p
            role="alert"
            className="absolute rounded-lg bg-black/80 p-4 text-sm"
          >
            Unable to load image.
          </p>
        )}
      </div>
      <div className="shrink-0 px-4 py-3 text-center">
        {caption != null && <div className="mb-1 text-xs text-neutral-200">{caption}</div>}
      </div>
    </div>
  )
}

function constrain(
  transform: Transform,
  canvas: HTMLDivElement | null,
  image: HTMLImageElement | null
): Transform {
  const scale = clamp(transform.scale, MIN_SCALE, MAX_SCALE)
  if (!canvas || !image) return { scale, x: 0, y: 0 }
  const maxX = Math.max(0, (image.offsetWidth * scale - canvas.clientWidth) / 2)
  const maxY = Math.max(
    0,
    (image.offsetHeight * scale - canvas.clientHeight) / 2
  )
  return {
    scale,
    x: clamp(transform.x, -maxX, maxX),
    y: clamp(transform.y, -maxY, maxY),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
