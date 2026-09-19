import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { BusinessContext, UpdateBlueprintPatch } from "@/services/blueprint.types"
import { useAutosave } from "./use-autosave"

type FakeResponse = { ok: boolean; json: () => Promise<unknown> }

const okResponse: FakeResponse = { ok: true, json: async () => ({}) }
const failResponse: FakeResponse = { ok: false, json: async () => ({ error: "stale" }) }

const ctx = (industry: string): BusinessContext => ({
  industry,
  audience: "",
  competitors: [],
  differentiators: "",
})

const patchOf = (industry: string): UpdateBlueprintPatch => ({ businessContext: ctx(industry) })

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function renderAutosave(patch: UpdateBlueprintPatch | null) {
  return renderHook(({ patch }) => useAutosave(1, patch), {
    initialProps: { patch },
  })
}

function bodyOf(call: unknown[]) {
  return JSON.parse((call[1] as { body: string }).body)
}

function hideDocument() {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "hidden",
  })
  document.dispatchEvent(new Event("visibilitychange"))
}

function pageHide() {
  window.dispatchEvent(new Event("pagehide"))
}

/**
 * Mount with nothing, then supply the patch — the shape of a real edit.
 * The patch present at mount is the record just loaded from the server and is
 * seeded as already-saved, so a hook rendered directly with it has nothing to
 * send. Tests that want a pending write must change the patch after mount.
 */
function renderEdited(patch: UpdateBlueprintPatch) {
  const rendered = renderAutosave(null)
  rendered.rerender({ patch })
  return rendered
}

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    // `hideDocument` shadows the jsdom getter with an own property.
    delete (document as unknown as Record<string, unknown>).visibilityState
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("debounces a burst of changes into a single save of the latest patch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    const { rerender } = renderAutosave(patchOf("a"))
    rerender({ patch: patchOf("b") })
    rerender({ patch: patchOf("c") })

    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe("/api/blueprints/1")
    expect(bodyOf(fetchMock.mock.calls[0]).businessContext.industry).toBe("c")
  })

  it("saves immediately on flush and does not fire the pending debounce too", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    const { result, rerender } = renderAutosave(null)
    rerender({ patch: patchOf("a") })

    await act(async () => {
      await result.current.flush()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe("saved")

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("is a no-op when flushing a patch that was already saved", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderEdited(patchOf("a"))

    await act(async () => {
      await result.current.flush()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    let second: boolean | undefined
    await act(async () => {
      second = await result.current.flush()
    })

    expect(second).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe("saved")
  })

  it("ignores a stale response that lands after a newer save resolved", async () => {
    const first = deferred<FakeResponse>()
    const second = deferred<FakeResponse>()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    vi.stubGlobal("fetch", fetchMock)

    const { result, rerender } = renderEdited(patchOf("a"))

    let firstFlush!: Promise<boolean>
    act(() => {
      firstFlush = result.current.flush()
    })

    rerender({ patch: patchOf("b") })

    let secondFlush!: Promise<boolean>
    act(() => {
      secondFlush = result.current.flush()
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      second.resolve(okResponse)
      await secondFlush
    })
    expect(result.current.status).toBe("saved")

    await act(async () => {
      first.resolve(failResponse)
      await firstFlush
    })

    expect(result.current.status).toBe("saved")
  })

  it("does not save when the patch is still null", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderAutosave(null)

    let flushed: boolean | undefined
    await act(async () => {
      flushed = await result.current.flush()
    })
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(flushed).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.status).toBe("idle")
  })

  it("does not PATCH on mount: the patch it loaded with is already the saved state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    renderAutosave(patchOf("a"))

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Regression: a same-tab reload fires beforeunload -> pagehide ->
  // visibilitychange, and by the time visibilitychange arrives the document is
  // unloading and the request never leaves. Measured in a real browser: a
  // visibilitychange-only handler ran but the edit was still lost. pagehide is
  // the terminal signal that actually works.
  it("flushes a pending patch with keepalive on pagehide", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    renderEdited(patchOf("a"))
    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      pageHide()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("/api/blueprints/1")
    expect(init.method).toBe("PATCH")
    expect(init.keepalive).toBe(true)
    expect(bodyOf(fetchMock.mock.calls[0]).businessContext.industry).toBe("a")
  })

  it("sends the beacon only once when pagehide and visibilitychange both fire", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    renderEdited(patchOf("a"))

    await act(async () => {
      pageHide()
      hideDocument()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("flushes a pending patch with keepalive when the document is hidden", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    renderEdited(patchOf("a"))

    // The debounce has not elapsed, so nothing has been sent yet.
    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      hideDocument()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("/api/blueprints/1")
    expect(init.method).toBe("PATCH")
    expect(init.keepalive).toBe(true)
    expect(bodyOf(fetchMock.mock.calls[0]).businessContext.industry).toBe("a")
  })

  it("does not fire a keepalive save when the patch is already saved", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderEdited(patchOf("a"))

    await act(async () => {
      await result.current.flush()
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      hideDocument()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("removes both teardown listeners on unmount", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse)
    vi.stubGlobal("fetch", fetchMock)

    const { unmount } = renderEdited(patchOf("a"))
    unmount()

    await act(async () => {
      pageHide()
      hideDocument()
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
