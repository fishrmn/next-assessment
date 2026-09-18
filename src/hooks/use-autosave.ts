import { useCallback, useEffect, useRef, useState } from "react"
import type { UpdateBlueprintPatch } from "@/services/blueprint.types"

type AutosaveStatus = "idle" | "saving" | "saved" | "error"

export function useAutosave(
  blueprintId: number,
  patch: UpdateBlueprintPatch | null,
  options?: { delayMs?: number }
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle")
  const delayMs = options?.delayMs ?? 600

  // Latest args, so flush() never sends a stale payload from a closure.
  const latestRef = useRef({ blueprintId, patch })
  useEffect(() => {
    latestRef.current = { blueprintId, patch }
  }, [blueprintId, patch])

  // Seeded with the patch as it was on mount: that payload is the record we
  // just loaded from the server, so saving it back would be a no-op PATCH on
  // every page load. Only a real edit should reach the network.
  const lastSavedRef = useRef<string | null>(patch === null ? null : JSON.stringify(patch))
  const inFlightRef = useRef<string | null>(null)
  const requestIdRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // `pagehide` and `visibilitychange` can both fire for one teardown, so the
  // beacon remembers what it already sent rather than PATCHing twice.
  const beaconSentRef = useRef<string | null>(null)

  // Returns true when the patch is saved (or already up to date / nothing
  // to save), false when the save failed. Callers that need to know the
  // outcome must use this return value rather than the `status` state —
  // `status` is only updated via `setStatus` here, so a value read from a
  // closure created before this call resolves is stale until the component
  // re-renders.
  const flush = useCallback(async (): Promise<boolean> => {
    const { blueprintId, patch } = latestRef.current
    if (patch === null) return true

    const payload = JSON.stringify(patch)
    if (payload === lastSavedRef.current) return true
    if (payload === inFlightRef.current) {
      // Already saving this exact payload — the in-flight call owns the
      // status transition; nothing more for this caller to do but wait.
      return true
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null

    const requestId = ++requestIdRef.current
    inFlightRef.current = payload
    setStatus("saving")
    try {
      const res = await fetch(`/api/blueprints/${blueprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error("Autosave failed:", body.error, body.issues)
        if (requestId === requestIdRef.current) setStatus("error")
        return false
      }

      if (requestId !== requestIdRef.current) return true
      lastSavedRef.current = payload
      setStatus("saved")
      return true
    } catch (err) {
      console.error("Autosave failed:", err)
      if (requestId === requestIdRef.current) setStatus("error")
      return false
    } finally {
      if (inFlightRef.current === payload) inFlightRef.current = null
    }
  }, [])

  useEffect(() => {
    if (patch === null) return
    if (JSON.stringify(patch) === lastSavedRef.current) return

    const timer = setTimeout(flush, delayMs)
    timerRef.current = timer
    return () => clearTimeout(timer)
  }, [blueprintId, patch, delayMs, flush])

  // The canvas has no "Done" button, so a debounce still pending when the
  // document goes away would silently drop keystrokes. A plain fetch in a
  // `beforeunload` handler does not survive teardown — browsers cancel it —
  // so this sends with `keepalive`, which the browser is obliged to finish.
  // Fire-and-forget: there is no UI left to inform.
  //
  // Listen on BOTH `pagehide` and `visibilitychange`, because they are not
  // interchangeable. On a same-tab reload or navigation Chrome fires
  // `beforeunload` → `pagehide` → `visibilitychange`, and by the time
  // `visibilitychange` arrives the document is already unloading and the
  // request never leaves — measured in a real browser, where a
  // visibilitychange-only handler lost the edit even though it ran.
  // `pagehide` is the reliable terminal signal; `visibilitychange` is the one
  // that catches backgrounding a tab the user never closes.
  useEffect(() => {
    function sendBeacon() {
      const { blueprintId, patch } = latestRef.current
      if (patch === null) return

      const payload = JSON.stringify(patch)
      if (payload === lastSavedRef.current || payload === beaconSentRef.current) return
      beaconSentRef.current = payload

      fetch(`/api/blueprints/${blueprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") sendBeacon()
    }

    window.addEventListener("pagehide", sendBeacon)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.removeEventListener("pagehide", sendBeacon)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  return { status, flush }
}
