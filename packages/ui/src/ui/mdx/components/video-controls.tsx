"use client"

import { Popover } from "@base-ui/react/popover"
import { Select } from "@base-ui/react/select"
import { Slider } from "@base-ui/react/slider"
import { Tooltip } from "@base-ui/react/tooltip"
import {
  Check,
  ChevronDown,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react"
import { cn } from "cn"
import { useId, useState, type ReactNode, type RefObject } from "react"

import { formatVideoTime, type useVideoPlayer } from "./use-video-player"

type Player = ReturnType<typeof useVideoPlayer>

const controlClassName =
  "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none"

const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((value) => ({
  value,
  label: `${value}×`,
}))

export function VideoControls({ player }: { player: Player }) {
  const { state } = player
  const muted = state.muted || state.volume === 0
  // Escape article/preview clipping inline; fullscreen popups must stay in the top-layer element.
  const portalContainer = player.fullscreen ? player.containerRef : undefined
  return (
    <Tooltip.Provider delay={300}>
      <div
        data-slot="video-controls"
        className="w-full z-10 shrink-0 rounded-xl px-2 pb-2 text-white sm:px-3"
      >
        <MediaSlider
          label="Seek"
          value={state.time}
          max={state.duration || 1}
          step={0.1}
          disabled={!state.duration || Boolean(state.error)}
          onChange={player.seek}
          valueText={`${formatVideoTime(state.time)} of ${formatVideoTime(state.duration)}`}
          className="w-full"
          revealOnHover
        />
        <div className="flex flex-wrap items-center gap-x-1">
          <Control
            label={state.playing ? "Pause" : "Play"}
            onClick={() => void player.togglePlayback()}
            disabled={Boolean(state.error)}
            container={portalContainer}
          >
            {state.playing ? <Pause /> : <Play />}
          </Control>
          <Control
            label="Back 10 seconds"
            onClick={() => player.seek(state.time - 10)}
            disabled={!state.duration}
            container={portalContainer}
          >
            <RotateCcw />
          </Control>
          <Control
            label="Forward 10 seconds"
            onClick={() => player.seek(state.time + 10)}
            disabled={!state.duration}
            container={portalContainer}
          >
            <RotateCw />
          </Control>
          <Popover.Root>
            <Popover.Trigger
              openOnHover
              closeDelay={100}
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={player.toggleMute}
              className={cn(controlClassName, "data-popup-open:bg-white/10")}
            >
              <span
                aria-hidden="true"
                className="[&>svg]:size-4.5 [&>svg]:shrink-0"
              >
                {muted ? <VolumeX /> : <Volume2 />}
              </span>
            </Popover.Trigger>
            <Popover.Portal container={portalContainer}>
              <Popover.Positioner side="top" sideOffset={8} className="z-50">
                <Popover.Popup
                  data-slot="video-volume"
                  initialFocus={(openType) => openType === "keyboard"}
                  className="origin-(--transform-origin) rounded-2xl border border-foreground/5 backdrop-blur-sm bg-neutral-900/80 px-4 py-0.75 text-white shadow-xl outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
                >
                  <Popover.Title className="sr-only">Volume</Popover.Title>
                  <MediaSlider
                    label="Volume"
                    value={muted ? 0 : state.volume}
                    max={1}
                    step={0.05}
                    onChange={player.changeVolume}
                    valueText={`${Math.round((muted ? 0 : state.volume) * 100)}%`}
                    className="w-32"
                  />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <div className="ml-auto flex gap-1 items-center">
            <span
              className="px-2 text-xs text-white/75 tabular-nums"
              role="timer"
              aria-label="Playback time"
            >
              {formatVideoTime(state.time)} / {formatVideoTime(state.duration)}
            </span>
            <Select.Root
              items={rates}
              value={state.rate}
              onValueChange={(rate) => {
                if (rate != null) player.changeRate(rate)
              }}
              modal={false}
            >
              <Select.Trigger
                aria-label="Playback speed"
                className="group flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm tabular-nums transition-colors outline-none hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white motion-reduce:transition-none"
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-150 group-data-popup-open:rotate-180 motion-reduce:transition-none"
                  />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal container={portalContainer}>
                <Select.Positioner
                  side="top"
                  align="end"
                  sideOffset={8}
                  alignItemWithTrigger={false}
                  className="z-50"
                >
                  <Select.Popup className="min-w-28 origin-(--transform-origin) rounded-xl border border-foreground/5 backdrop-blur-sm bg-neutral-900/80 p-1 text-white shadow-xl transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
                    <Select.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto">
                      {rates.map((rate) => (
                        <Select.Item
                          key={rate.value}
                          value={rate.value}
                          className="flex min-h-8 cursor-pointer items-center justify-between gap-6 rounded-lg px-3 text-sm outline-none data-highlighted:bg-white/10"
                        >
                          <Select.ItemText>{rate.label}</Select.ItemText>
                          <Select.ItemIndicator>
                            <Check className="size-4" aria-hidden="true" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>

            <Control
              label={player.fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={() => void player.toggleFullscreen()}
              disabled={!player.fullscreenSupported}
              container={portalContainer}
            >
              {player.fullscreen ? <Minimize /> : <Maximize />}
            </Control>
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  )
}

function Control({
  label,
  children,
  onClick,
  disabled,
  container,
}: {
  label: string
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  container?: RefObject<HTMLDivElement | null>
}) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  return (
    <Tooltip.Root onOpenChange={setOpen}>
      <Tooltip.Trigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-describedby={open ? tooltipId : undefined}
            disabled={disabled}
            onClick={onClick}
            className={controlClassName}
          />
        }
      >
        <span aria-hidden="true" className="[&>svg]:size-4.5 [&>svg]:shrink-0">
          {children}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal container={container}>
        <Tooltip.Positioner side="top" sideOffset={8} className="z-50">
          <Tooltip.Popup
            id={tooltipId}
            role="tooltip"
            className="origin-(--transform-origin) rounded-xl border border-foreground/5 backdrop-blur-sm bg-neutral-900/80 px-3 py-2 text-xs text-white shadow-lg transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function MediaSlider({
  label,
  value,
  max,
  step,
  disabled,
  onChange,
  valueText,
  className,
  revealOnHover = false,
}: {
  label: string
  value: number
  max: number
  step: number
  disabled?: boolean
  onChange: (value: number) => void
  valueText: string
  className?: string
  revealOnHover?: boolean
}) {
  return (
    <Slider.Root
      value={value}
      min={0}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={onChange}
      className={cn("flex min-h-8 items-center", className)}
    >
      <Slider.Control className="group/slider relative flex h-8 w-full cursor-pointer touch-none items-center select-none data-disabled:cursor-default data-disabled:opacity-40">
        <Slider.Track
          className={cn(
            "w-full overflow-hidden rounded-full bg-white/25",
            revealOnHover
              ? "h-0.5 transition-[height] duration-150 group-hover/slider:h-1 motion-reduce:transition-none"
              : "h-1"
          )}
        >
          <Slider.Indicator className="h-full rounded-full bg-white" />
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          aria-valuetext={valueText}
          className={cn(
            "size-3 rounded-full bg-white shadow outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950",
            revealOnHover &&
              "opacity-0 transition-opacity duration-150 group-hover/slider:opacity-100 focus-visible:opacity-100 data-dragging:opacity-100 motion-reduce:transition-none"
          )}
        />
      </Slider.Control>
    </Slider.Root>
  )
}
