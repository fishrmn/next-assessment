import { useCallback, useSyncExternalStore } from "react"

const subscribeToFullscreen = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange)
  return () => document.removeEventListener("fullscreenchange", onChange)
}

// Support never changes after load, so nothing has to be subscribed to — this
// only exists to keep the value off the server snapshot.
const subscribeToNothing = () => () => {}

const isFullscreenNow = () => document.fullscreenElement !== null
const isSupportedNow = () => typeof document.documentElement.requestFullscreen === "function"
const serverFalse = () => false

/**
 * Full-screen toggle for the whole page (`document.documentElement`).
 *
 * `isFullscreen` is read straight from `document.fullscreenElement` on every
 * `fullscreenchange`, never from a boolean we flip ourselves: Esc and F11 leave
 * full screen without touching our button, and a locally tracked flag would
 * then label that button "Exit full screen" on a windowed page.
 *
 * Both flags are false in the server snapshot so the first client render
 * matches the server HTML — no hydration mismatch.
 */
export function useFullscreen(): {
  isFullscreen: boolean
  isSupported: boolean
  toggle: () => void
} {
  const isFullscreen = useSyncExternalStore(subscribeToFullscreen, isFullscreenNow, serverFalse)
  const isSupported = useSyncExternalStore(subscribeToNothing, isSupportedNow, serverFalse)

  const toggle = useCallback(() => {
    if (!isSupportedNow()) return

    // Rejects when the browser refuses (no user gesture, iOS Safari). A no-op
    // button beats an unhandled rejection in the console.
    const request = isFullscreenNow()
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
    void request.catch(() => {})
  }, [])

  return { isFullscreen, isSupported, toggle }
}
