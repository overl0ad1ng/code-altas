"use client"

import { cn } from "cn"
import { LoaderCircle, Play } from "lucide-react"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

import { VideoControls } from "./video-controls"
import { useVideoPlayer } from "./use-video-player"

export interface VideoProps extends Omit<
  ComponentPropsWithoutRef<"video">,
  "src" | "controls"
> {
  src: string
  caption?: ReactNode
}

/** Changing sources starts a fresh player without carrying media state between recordings. */
export function Video(props: VideoProps) {
  return <VideoPlayer key={props.src} {...props} />
}

function VideoPlayer({
  src,
  title = "Video player",
  caption,
  className,
  preload = "metadata",
  playsInline = true,
  ...props
}: VideoProps) {
  const player = useVideoPlayer(props.muted)
  const { state } = player
  return (
    <figure
      data-slot="video"
      className={cn("my-6 max-w-full min-w-0", className)}
    >
      <div
        ref={player.containerRef}
        role="region"
        aria-label={title}
        tabIndex={0}
        onKeyDown={player.onKeyDown}
        data-slot="video-player"
        className={cn(
          "relative group overflow-hidden rounded-xl border border-border bg-neutral-900/95 text-white outline-none focus-visible:ring-2 focus-visible:ring-ring",
          player.fullscreen &&
            "fixed inset-0 flex h-dvh w-screen flex-col rounded-none border-0"
        )}
      >
        <div
          className={cn(
            "relative",
            player.fullscreen ? "min-h-0 flex-1" : "aspect-video"
          )}
        >
          <video
            {...props}
            ref={player.videoRef}
            src={src}
            aria-label={title}
            controls={false}
            playsInline={playsInline}
            preload={preload}
            className="h-full w-full object-contain"
            onClick={(event) => {
              props.onClick?.(event)
              if (!event.defaultPrevented) void player.togglePlayback()
            }}
          />

          {!state.playing && !state.error && (
            <button
              type="button"
              aria-label="Play video"
              onClick={() => void player.togglePlayback()}
              className="absolute top-1/2 left-1/2 inline-flex size-14 -translate-1/2 cursor-pointer items-center justify-center rounded-full border border-foreground/5 bg-neutral-900/80 text-white backdrop-blur-sm transition-[background-color,scale] duration-150 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
            >
              <Play className="size-6" aria-hidden="true" />
            </button>
          )}

          {player.buffering && (
            <span
              role="status"
              className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-xs"
            >
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Buffering…
            </span>
          )}

          {state.error && (
            <div
              role="alert"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center text-sm"
            >
              <p>{state.error}</p>
              <button
                type="button"
                onClick={() => player.videoRef.current?.load()}
                className="min-h-11 cursor-pointer rounded-lg border border-white/30 px-4 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
              >
                Retry video
              </button>
            </div>
          )}
        </div>

        <VideoControls player={player} />

        {player.notice && (
          <p
            role="status"
            className="m-0 bg-neutral-800 px-4 pb-3 text-sm text-white/80"
          >
            {player.notice}
          </p>
        )}
      </div>
      {caption != null && (
        <figcaption
          data-slot="video-caption"
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
