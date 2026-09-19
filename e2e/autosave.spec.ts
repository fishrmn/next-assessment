import { expect, test, type Locator, type Page } from "@playwright/test"

function field(page: Page, label: string): Locator {
  return page.getByLabel(label, { exact: true })
}

function saveStatus(page: Page): Locator {
  return page.locator('[aria-live="polite"]')
}

/**
 * Resolves once an autosave PATCH carrying `value` has been acknowledged.
 *
 * The status element on its own cannot gate a reload: it still reads "Saved"
 * from the previous write while the next debounce is pending, so asserting on
 * it can pass before the latest keystrokes have left the browser. Register
 * this *before* typing, await it after.
 */
function savedPatch(page: Page, value: string) {
  return page.waitForResponse(
    (res) =>
      res.request().method() === "PATCH" &&
      res.url().includes("/api/blueprints/") &&
      res.ok() &&
      (res.request().postData() ?? "").includes(value),
  )
}

async function createBlueprint(page: Page, label: string) {
  await page.goto("/")
  // Typing can land before React hydrates, and hydration then resets the
  // controlled input back to empty — so the button would never enable and
  // simply waiting on it would hang. Retry the fill until the app is live.
  const startButton = page.getByRole("button", { name: "Start a Blueprint" })
  await expect(async () => {
    await page.getByPlaceholder("Client name").fill(`${label} ${Date.now()}`)
    await expect(startButton).toBeEnabled({ timeout: 1000 })
  }).toPass({ timeout: 20000 })
  await startButton.click()
  await page.waitForURL(/\/blueprint\/\d+$/)
}

test("debounced autosave persists a field across a reload", async ({ page }) => {
  const differentiators = "Zero-waste packaging and dermatologist-formulated actives"
  await createBlueprint(page, "Basic Persistence Co")

  const saved = savedPatch(page, differentiators)
  await field(page, "Differentiators").fill(differentiators)
  await saved

  await page.reload()
  await expect(field(page, "Differentiators")).toHaveValue(differentiators)
})

test("persists edits made in two sections in quick succession", async ({ page }) => {
  // One autosave instance now covers the whole document, so an edit in
  // Business Context and an edit in Voice & Personality inside the same
  // debounce window must both survive — neither section can clobber the other.
  const industry = "Boutique coffee roaster"
  const toneOfVoice = "Plain-spoken and unhurried"
  await createBlueprint(page, "Two Sections Co")

  const saved = savedPatch(page, toneOfVoice)
  await field(page, "Industry").fill(industry)
  await field(page, "Tone of voice").fill(toneOfVoice)
  await saved

  await page.reload()
  await expect(field(page, "Industry")).toHaveValue(industry)
  await expect(field(page, "Tone of voice")).toHaveValue(toneOfVoice)
})

test("reports Saved in the status region once the debounced write lands", async ({ page }) => {
  const audience = "Independent bookshops"
  await createBlueprint(page, "Save Status Co")

  // No idle precondition: the autosave effect arms on mount, so the status can
  // already read "Saved" from a no-op write before any key is pressed. Gating
  // on the PATCH that actually carries `audience` is what makes the assertion
  // below about this edit rather than about whatever was on screen.
  const saved = savedPatch(page, audience)
  await field(page, "Audience").fill(audience)
  await saved

  await expect(saveStatus(page)).toHaveText("Saved")
})
