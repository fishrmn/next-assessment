"use client"

import { useCallback, useSyncExternalStore } from "react"

import type { Stage } from "@/lib/blueprint/fields"

/**
 * Who has the width. One conversation and one document, in three layouts:
 * - "document": the Blueprint across the screen, the agent tucked into a button. For reading,
 *   presenting and deciding.
 * - "side": the Blueprint with the agent docked beside it. For correcting.
 * - "agent": the conversation across the screen. For starting from nothing, or talking at length.
 */
export type Mode = "document" | "side" | "agent"

/**
 * The layout the product proposes for where the person is. It follows the moment: nothing to
 * show yet, so talk; a proposal to judge, so put the agent next to it; a Blueprint the person
 * confirmed, so get out of the way.
 */
export function defaultMode(stage: Stage, confirmed: boolean): Mode {
  if (stage === "start") return "agent"
  return confirmed ? "document" : "side"
}

const CHANGED = "blueprint-mode-changed"
const key = (id: number) => `blueprint-mode:${id}`

function isMode(value: string | null): value is Mode {
  return value === "document" || value === "side" || value === "agent"
}

/**
 * The person's own choice of layout for one Blueprint, kept in this browser. `null` means they
 * never chose, and the product's proposal applies. Once they choose, the choice wins: a panel
 * that closes by itself when nobody asked is worse than one that never moves.
 *
 * Read through `useSyncExternalStore`, so the server render and the first client render agree
 * (both see `null`) and the stored choice arrives right after, without a hydration error.
 */
export function useChosenMode(id: number): [Mode | null, (mode: Mode) => void] {
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener(CHANGED, notify)
    window.addEventListener("storage", notify)
    return () => {
      window.removeEventListener(CHANGED, notify)
      window.removeEventListener("storage", notify)
    }
  }, [])

  const chosen = useSyncExternalStore(
    subscribe,
    () => {
      const stored = window.localStorage.getItem(key(id))
      return isMode(stored) ? stored : null
    },
    () => null
  )

  const choose = useCallback(
    (mode: Mode) => {
      window.localStorage.setItem(key(id), mode)
      window.dispatchEvent(new Event(CHANGED))
    },
    [id]
  )

  return [chosen, choose]
}
