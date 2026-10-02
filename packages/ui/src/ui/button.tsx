"use client"

import type { ComponentProps } from "react"

import { Button as ButtonPrimitive } from "../primitives/button"

export type ButtonProps = ComponentProps<typeof ButtonPrimitive>

export function Button(props: ButtonProps) {
  return <ButtonPrimitive {...props} />
}
