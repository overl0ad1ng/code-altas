"use client"

import { Dialog } from "@base-ui/react/dialog"
import { cn } from "cn"
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

import { ImagePreview } from "./image-preview"

export interface ImageProps extends ComponentPropsWithoutRef<"img"> {
  caption?: ReactNode
  zoomable?: boolean
}

/** An inline-safe image and caption, with a modal preview for inspecting details. */
export function Image({
  alt = "",
  caption,
  className,
  loading = "lazy",
  zoomable = true,
  ...props
}: ImageProps) {
  const actionsRef = useRef<Dialog.Root.Actions | null>(null)
  const image = (
    <img
      {...props}
      alt={alt}
      loading={loading}
      className={cn("h-auto max-w-full rounded-lg", className)}
    />
  )
  return (
    <span
      data-slot="image"
      className="my-6 inline-flex max-w-full flex-col align-middle"
    >
      {zoomable ? (
        <Dialog.Root actionsRef={actionsRef}>
          <Dialog.Trigger
            aria-label={alt ? `Enlarge image: ${alt}` : "Enlarge image"}
            className="block max-w-full cursor-zoom-in rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {image}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/85 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
            <Dialog.Popup className="fixed inset-0 z-50 text-white outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none">
              <Dialog.Title className="sr-only">
                {alt || "Image preview"}
              </Dialog.Title>
              <ImagePreview
                src={props.src}
                srcSet={props.srcSet}
                sizes={props.srcSet ? "100vw" : undefined}
                crossOrigin={props.crossOrigin}
                referrerPolicy={props.referrerPolicy}
                alt={alt}
                caption={caption}
                onClose={() => actionsRef.current?.close()}
              />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ) : (
        image
      )}
      {caption != null && (
        <span
          data-slot="image-caption"
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          {caption}
        </span>
      )}
    </span>
  )
}
