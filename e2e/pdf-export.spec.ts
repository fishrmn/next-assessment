import { expect, test, type Page } from "@playwright/test"

const PROMPT_PLACEHOLDER = "Describe your brand in a sentence or two — AI fills the blanks."
const SAVE_STATUS = '[aria-live="polite"]'

/**
 * 90 characters — longer than a single-line `<input>` can show, which is the
 * whole reason the field components print a span instead of the control.
 * Names navy / gold / cream so the palette has swatches to print.
 */
const LONG_COLOR_DIRECTION =
  "Deep navy and warm gold over a soft cream ground, quiet enough for the accent to carry it."

const INDUSTRY = "Specialty coffee roasting"
const TYPOGRAPHY = "Clean sans-serif for clarity"
const TONE = "Warm, direct, never precious."

type PrintWindow = Window & { __printCalls?: number }

/** Counts `window.print()` rather than opening the browser's print dialog. */
async function stubPrint(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as PrintWindow
    w.__printCalls = 0
    w.print = () => {
      w.__printCalls = (w.__printCalls ?? 0) + 1
    }
  })
}

function printCalls(page: Page): Promise<number> {
  return page.evaluate(() => (window as PrintWindow).__printCalls ?? 0)
}

/**
 * The blueprint UI only. Next's dev overlay lives in a shadow root appended to
 * `<body>` and Playwright's CSS engine pierces open shadow roots, so an
 * unscoped `button:visible` count would pick up its chrome too.
 */
function canvas(page: Page) {
  return page.locator("body > div").filter({ has: page.locator("header") })
}

async function createFilledBlueprint(page: Page, clientName: string): Promise<void> {
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

  await page.getByLabel("Industry", { exact: true }).fill(INDUSTRY)
  await page.getByLabel("Color direction", { exact: true }).fill(LONG_COLOR_DIRECTION)
  await page.getByLabel("Typography", { exact: true }).fill(TYPOGRAPHY)
  await page.getByLabel("Tone of voice", { exact: true }).fill(TONE)
  await expect(page.locator(SAVE_STATUS)).toHaveText("Saved")
}

test("Export as PDF calls window.print()", async ({ page }) => {
  await stubPrint(page)
  await createFilledBlueprint(page, `Print Call ${Date.now()}`)

  expect(await printCalls(page)).toBe(0)

  await page.getByRole("button", { name: "Export as PDF" }).click()

  await expect.poll(() => printCalls(page)).toBe(1)
})

test("print media hides the AI prompt row, the Jump-to nav and every button", async ({ page }) => {
  await createFilledBlueprint(page, `Print Chrome ${Date.now()}`)

  const promptRow = page.getByPlaceholder(PROMPT_PLACEHOLDER)
  const jumpToNav = page.locator('nav[aria-label="Jump to section"]')

  await expect(promptRow).toBeVisible()
  await expect(jumpToNav).toBeVisible()
  await expect(canvas(page).locator("button:visible")).not.toHaveCount(0)

  await page.emulateMedia({ media: "print" })

  await expect(promptRow).toBeHidden()
  await expect(jumpToNav).toBeHidden()
  await expect(canvas(page).locator("button:visible")).toHaveCount(0)

  await page.emulateMedia({ media: "screen" })
})

test("print media keeps the document body, the palette and the type specimen", async ({ page }) => {
  await createFilledBlueprint(page, `Print Deliverable ${Date.now()}`)
  await page.emulateMedia({ media: "print" })

  await expect(page.getByRole("heading", { name: "Business Context" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Brand Expression" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Voice & Personality" })).toBeVisible()
  // Each field's value appears twice by design — the interactive control and
  // the print-only span that replaces it — so match the one actually rendered
  // in this media type rather than tripping strict mode on both.
  await expect(page.getByText(INDUSTRY, { exact: true }).filter({ visible: true })).toBeVisible()
  await expect(page.getByText(TONE, { exact: true }).filter({ visible: true })).toBeVisible()

  // A Brand Blueprint PDF without these two is missing the actual deliverable.
  const artifacts = page.getByRole("complementary")
  await expect(artifacts.getByText("Palette", { exact: true })).toBeVisible()
  await expect(artifacts.getByText("#1f2f4d")).toBeVisible() // navy
  await expect(artifacts.getByText("#b68235")).toBeVisible() // gold
  await expect(artifacts.getByText("Type specimen", { exact: true })).toBeVisible()
  await expect(artifacts.getByText("Aa Bb", { exact: true })).toBeVisible()
  await expect(artifacts.getByText("Sans-serif — clear, contemporary")).toBeVisible()

  await page.emulateMedia({ media: "screen" })
})

test("print media swaps every field control for wrapping static text", async ({ page }) => {
  await createFilledBlueprint(page, `Print Text ${Date.now()}`)
  await page.emulateMedia({ media: "print" })

  // Every `.bp-in` control on the page has to swap, including the header's
  // inline title — a form control in the PDF is a control that clips. Reported
  // by id/aria-label so a regression names the control that leaked through.
  const leakedControls = await canvas(page)
    .locator("input:visible, textarea:visible")
    .evaluateAll((els) => els.map((el) => el.id || el.getAttribute("aria-label") || el.tagName))
  expect(leakedControls).toEqual([])

  const colorControl = page.locator("#field-colorDirection")
  const colorPrinted = page.locator("#field-colorDirection + span")

  await expect(colorControl).toBeHidden()
  await expect(colorPrinted).toBeVisible()
  await expect(colorPrinted).toHaveText(LONG_COLOR_DIRECTION)

  // The span wraps, so all 90 characters sit inside its own box. The input it
  // replaces would have scrolled instead and clipped mid-sentence.
  const overflow = await colorPrinted.evaluate((el) => el.scrollWidth - el.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)

  await page.emulateMedia({ media: "screen" })
})
