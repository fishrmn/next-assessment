import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useFullscreen } from "./use-fullscreen"

// jsdom implements none of the Fullscreen API, so the whole surface is stubbed
// here and `document.fullscreenElement` is driven by hand.
let fullscreenElement: Element | null = null

function define(target: object, key: string, value: unknown) {
  Object.defineProperty(target, key, { configurable: true, writable: true, value })
}

function setFullscreenElement(element: Element | null) {
  fullscreenElement = element
}

beforeEach(() => {
  setFullscreenElement(null)
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  })
  define(document.documentElement, "requestFullscreen", vi.fn(() => Promise.resolve()))
  define(document, "exitFullscreen", vi.fn(() => Promise.resolve()))
})

describe("useFullscreen", () => {
  it("reports unsupported and does nothing on toggle when requestFullscreen is missing", () => {
    define(document.documentElement, "requestFullscreen", undefined)
    const exit = vi.fn(() => Promise.resolve())
    define(document, "exitFullscreen", exit)

    const { result } = renderHook(() => useFullscreen())

    expect(result.current.isSupported).toBe(false)
    expect(() => act(() => result.current.toggle())).not.toThrow()
    expect(exit).not.toHaveBeenCalled()
  })

  it("requests fullscreen on the document element when windowed", () => {
    const request = vi.fn(() => Promise.resolve())
    define(document.documentElement, "requestFullscreen", request)

    const { result } = renderHook(() => useFullscreen())

    expect(result.current.isSupported).toBe(true)
    act(() => result.current.toggle())

    expect(request).toHaveBeenCalledTimes(1)
  })

  it("exits fullscreen when already fullscreen", () => {
    const request = vi.fn(() => Promise.resolve())
    const exit = vi.fn(() => Promise.resolve())
    define(document.documentElement, "requestFullscreen", request)
    define(document, "exitFullscreen", exit)
    setFullscreenElement(document.documentElement)

    const { result } = renderHook(() => useFullscreen())

    expect(result.current.isFullscreen).toBe(true)
    act(() => result.current.toggle())

    expect(exit).toHaveBeenCalledTimes(1)
    expect(request).not.toHaveBeenCalled()
  })

  it("flips isFullscreen from a fullscreenchange event alone (the Esc-key path)", () => {
    const request = vi.fn(() => Promise.resolve())
    define(document.documentElement, "requestFullscreen", request)

    const { result } = renderHook(() => useFullscreen())
    expect(result.current.isFullscreen).toBe(false)

    act(() => {
      setFullscreenElement(document.documentElement)
      document.dispatchEvent(new Event("fullscreenchange"))
    })

    expect(result.current.isFullscreen).toBe(true)
    expect(request).not.toHaveBeenCalled()

    act(() => {
      setFullscreenElement(null)
      document.dispatchEvent(new Event("fullscreenchange"))
    })

    expect(result.current.isFullscreen).toBe(false)
  })

  it("removes the fullscreenchange listener on unmount", () => {
    const remove = vi.spyOn(document, "removeEventListener")

    const { unmount } = renderHook(() => useFullscreen())
    unmount()

    expect(remove).toHaveBeenCalledWith("fullscreenchange", expect.any(Function))
    remove.mockRestore()
  })

  it("swallows a rejected requestFullscreen instead of throwing", async () => {
    define(
      document.documentElement,
      "requestFullscreen",
      vi.fn(() => Promise.reject(new Error("denied")))
    )

    const { result } = renderHook(() => useFullscreen())

    expect(() => act(() => result.current.toggle())).not.toThrow()
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isFullscreen).toBe(false)
  })
})
