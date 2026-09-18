import { expect, test, type Locator, type Page } from "@playwright/test"

/**
 * Headless Chromium will not reliably enter real fullscreen — the OS-level
 * transition is unavailable and `requestFullscreen()` can reject outright — so
 * the Fullscreen API is stubbed and the assertions are about what the app does
 * with it. Same approach `pdf-export.spec.ts` takes with `window.print`.
 */
type FullscreenWindow = Window & {
  __fullscreenCalls?: { request: number; exit: number }
  /** Simulates the browser changing fullscreen state on its own (Escape, F11). */
  __setFullscreen?: (on: boolean) => void
}

async function stubFullscreen(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as FullscreenWindow
    const calls = { request: 0, exit: 0 }
    // Same object identity on `window`, so `page.evaluate` reads live counts.
    w.__fullscreenCalls = calls

    let current: Element | null = null
    let last: Element | null = null

    // The real event fires *at the fullscreen element* and bubbles to document,
    // so dispatch it the same way — an app listening on either the element or
    // `document` then sees it, and the test does not encode which one it picked.
    function fire(): void {
      const target = last ?? document.documentElement
      target.dispatchEvent(new Event("fullscreenchange", { bubbles: true }))
    }

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => current,
    })

    function enter(element: Element): Promise<void> {
      calls.request += 1
      current = element
      last = element
      fire()
      return Promise.resolve()
    }

    Element.prototype.requestFullscreen = function requestFullscreen(this: Element) {
      return enter(this)
    }

    document.exitFullscreen = function exitFullscreen() {
      calls.exit += 1
      current = null
      fire()
      return Promise.resolve()
    }

    w.__setFullscreen = (on: boolean) => {
      current = on ? (last ?? document.documentElement) : null
      fire()
    }
  })
}

function fullscreenCalls(page: Page): Promise<{ request: number; exit: number }> {
  return page.evaluate(
    () => (window as FullscreenWindow).__fullscreenCalls ?? { request: 0, exit: 0 }
  )
}

/** Drives `document.fullscreenElement` without any click — what Escape does. */
function setFullscreen(page: Page, on: boolean): Promise<void> {
  return page.evaluate((next) => {
    ;(window as FullscreenWindow).__setFullscreen?.(next)
  }, on)
}

/**
 * `exact` matters on both: role-name matching is a case-insensitive *substring*
 * by default, so a loose "Full screen" would also match "Exit full screen" and
 * the label assertions would pass in either state.
 */
function enterButton(page: Page): Locator {
  return page.getByRole("button", { name: "Full screen", exact: true })
}

function exitButton(page: Page): Locator {
  return page.getByRole("button", { name: "Exit full screen", exact: true })
}

async function createBlueprint(page: Page, label: string): Promise<void> {
  const clientName = `${label} ${Date.now()}`
  await page.goto("/")
  // Typing can land before React hydrates, and hydration then resets the
  // controlled input back to empty — so the button would never enable and
  // simply waiting on it would hang. Retry the fill until the app is live.
  const startButton = page.getByRole("button", { name: "Start a Blueprint" })
  await expect(async () => {
    await page.getByPlaceholder("Client name").fill(clientName)
    await expect(startButton).toBeEnabled({ timeout: 1000 })
  }).toPass({ timeout: 20000 })
  await startButton.click()
  await page.waitForURL(/\/blueprint\/\d+$/)
}

test("shows a Full screen button in the canvas header", async ({ page }) => {
  await stubFullscreen(page)
  await createBlueprint(page, "Fullscreen Visible")

  await expect(page.getByRole("banner").getByRole("button", { name: "Full screen", exact: true }))
    .toBeVisible()
})

test("calls requestFullscreen and relabels the button to Exit full screen", async ({ page }) => {
  await stubFullscreen(page)
  await createBlueprint(page, "Fullscreen Enter")

  expect(await fullscreenCalls(page)).toEqual({ request: 0, exit: 0 })

  await enterButton(page).click()

  await expect.poll(async () => (await fullscreenCalls(page)).request).toBe(1)
  await expect(exitButton(page)).toBeVisible()
  await expect(enterButton(page)).toHaveCount(0)
})

test("calls exitFullscreen when the button is clicked while fullscreen", async ({ page }) => {
  await stubFullscreen(page)
  await createBlueprint(page, "Fullscreen Exit")

  await enterButton(page).click()
  await expect(exitButton(page)).toBeVisible()

  await exitButton(page).click()

  await expect.poll(async () => (await fullscreenCalls(page)).exit).toBe(1)
  await expect(enterButton(page)).toBeVisible()
})

test("returns the label to Full screen when the browser leaves fullscreen without a click", async ({
  page,
}) => {
  // Escape leaves fullscreen without going through the button. A label derived
  // from a local boolean instead of the browser's state desyncs here: the app
  // is back in a normal window while still offering "Exit full screen", and the
  // next click then calls `exitFullscreen()` on nothing.
  await stubFullscreen(page)
  await createBlueprint(page, "Fullscreen Escape")

  await enterButton(page).click()
  await expect(exitButton(page)).toBeVisible()

  await setFullscreen(page, false)

  await expect(enterButton(page)).toBeVisible()
  await expect(exitButton(page)).toHaveCount(0)
  // The app did not ask to leave — the browser did. Proves the label is driven
  // by `fullscreenchange`, not by the click that happened to precede it.
  expect((await fullscreenCalls(page)).exit).toBe(0)
})
