import { expect, test, type Locator, type Page } from "@playwright/test"

const VALUES = {
  industry: "Direct-to-consumer skincare",
  audience: "Eco-conscious millennials",
  colorDirection: "navy and terracotta",
  typographyDirection: "clean sans-serif",
  toneOfVoice: "Warm, direct, never precious",
  trait: "Playful",
}

/** `derivePalette("navy and terracotta")`. */
const NAVY_HEX = "#1f2f4d"
/** `deriveTypeSpecimen("clean sans-serif")` — em dash, copied exactly. */
const SPECIMEN_LABEL = "Sans-serif — clear, contemporary"
/**
 * `deriveVoiceSample` prints `“<title> — <traits>, <tone>.”`. Matched without
 * the title so the assertion is about the derived line, not the heading beside
 * it; no character here needs escaping.
 */
const VOICE_SAMPLE = new RegExp(`— ${VALUES.trait.toLowerCase()}, ${VALUES.toneOfVoice}\\.`)

function field(page: Page, label: string): Locator {
  return page.getByLabel(label, { exact: true })
}

function saveStatus(page: Page): Locator {
  return page.locator('[aria-live="polite"]')
}

/**
 * The app's own markup. Next's dev overlay lives in a shadow root and
 * Playwright's CSS engine pierces open shadow roots, so an unscoped `input`
 * count picks up its chrome. The overlay mounts as `<nextjs-portal>`, so
 * selecting the page's own top-level elements leaves it out.
 */
function content(page: Page): Locator {
  return page.locator("body > div, body > main, body > article, body > section")
}

/**
 * Resolves once an autosave PATCH carrying `value` has been acknowledged.
 * Registered *before* typing: the status element still reads "Saved" from the
 * previous write while the next debounce is pending.
 */
function savedPatch(page: Page, value: string) {
  return page.waitForResponse(
    (res) =>
      res.request().method() === "PATCH" &&
      res.url().includes("/api/blueprints/") &&
      res.ok() &&
      (res.request().postData() ?? "").includes(value)
  )
}

async function createBlueprint(page: Page, label: string): Promise<string> {
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
  return clientName
}

/** The numeric id in the current `/blueprint/<id>` URL. */
function blueprintId(page: Page): string {
  const match = /\/blueprint\/(\d+)/.exec(page.url())
  expect(match, `expected a /blueprint/<id> URL, got ${page.url()}`).not.toBeNull()
  return match?.[1] ?? ""
}

async function fillDocument(page: Page): Promise<void> {
  await field(page, "Industry").fill(VALUES.industry)
  await field(page, "Audience").fill(VALUES.audience)
  await field(page, "Color direction").fill(VALUES.colorDirection)
  await field(page, "Typography").fill(VALUES.typographyDirection)
  await field(page, "Tone of voice").fill(VALUES.toneOfVoice)
  // Committed last, so it is the value that gates on the final save.
  await field(page, "Personality").fill(VALUES.trait)
  await field(page, "Personality").press("Enter")
}

function lookbookLink(page: Page): Locator {
  return page.getByRole("link", { name: "Lookbook", exact: true })
}

async function createFilledBlueprint(page: Page, label: string): Promise<string> {
  const clientName = await createBlueprint(page, label)
  const saved = savedPatch(page, VALUES.trait)
  await fillDocument(page)
  await saved
  await expect(saveStatus(page)).toHaveText("Saved")
  return clientName
}

test("opens the lookbook at /blueprint/<id>/lookbook from a header link", async ({ page }) => {
  await createFilledBlueprint(page, "Lookbook Route")
  const id = blueprintId(page)

  await expect(page.getByRole("banner").getByRole("link", { name: "Lookbook", exact: true }))
    .toBeVisible()
  await lookbookLink(page).click()

  await expect(page).toHaveURL(new RegExp(`/blueprint/${id}/lookbook$`))
})

test("presents the client name and every derived artifact", async ({ page }) => {
  const clientName = await createFilledBlueprint(page, "Lookbook Artifacts")
  await lookbookLink(page).click()
  await page.waitForURL(/\/lookbook$/)

  // The name also appears inside the derived voice sample, so it is not a
  // unique locator — the presence of the first one is the assertion.
  await expect(page.getByText(clientName).first()).toBeVisible()
  await expect(page.getByText(NAVY_HEX)).toBeVisible()
  await expect(page.getByText(SPECIMEN_LABEL)).toBeVisible()
  await expect(page.getByText(VOICE_SAMPLE)).toBeVisible()
})

test("renders the lookbook read-only, with no form controls at all", async ({ page }) => {
  const clientName = await createFilledBlueprint(page, "Lookbook Read Only")
  await lookbookLink(page).click()
  await page.waitForURL(/\/lookbook$/)

  // Guards the scope itself: a zero count below has to mean "no controls", not
  // "nothing matched".
  await expect(content(page)).not.toHaveCount(0)
  await expect(content(page).getByText(clientName).first()).toBeVisible()

  // Reported by id/aria-label so a regression names the control that leaked in.
  const controls = await content(page)
    .locator("input, textarea")
    .evaluateAll((els) => els.map((el) => el.id || el.getAttribute("aria-label") || el.tagName))
  expect(controls).toEqual([])
})

test("returns to the editable blueprint with its values intact", async ({ page }) => {
  await createFilledBlueprint(page, "Lookbook Back")
  const id = blueprintId(page)

  await lookbookLink(page).click()
  await page.waitForURL(/\/lookbook$/)

  await page.getByRole("link", { name: "Back to editing", exact: true }).click()

  await expect(page).toHaveURL(new RegExp(`/blueprint/${id}$`))
  await expect(field(page, "Industry")).toHaveValue(VALUES.industry)
  await expect(field(page, "Color direction")).toHaveValue(VALUES.colorDirection)
  await expect(field(page, "Typography")).toHaveValue(VALUES.typographyDirection)
  await expect(field(page, "Tone of voice")).toHaveValue(VALUES.toneOfVoice)
  await expect(page.getByRole("button", { name: `Remove ${VALUES.trait}` })).toBeVisible()
})

test("renders a half-filled blueprint without printing undefined or NaN", async ({ page }) => {
  // Partial saves are the normal state of this app — a single field can be
  // persisted on its own — so the lookbook is asked for a document whose
  // palette, specimen and voice sample all have nothing to derive from.
  const clientName = await createBlueprint(page, "Lookbook Partial")

  const saved = savedPatch(page, VALUES.industry)
  await field(page, "Industry").fill(VALUES.industry)
  await saved
  await expect(saveStatus(page)).toHaveText("Saved")

  await lookbookLink(page).click()
  await page.waitForURL(/\/lookbook$/)

  await expect(content(page).getByText(clientName).first()).toBeVisible()
  await expect(content(page).getByText(VALUES.industry).first()).toBeVisible()

  const text = await content(page).first().innerText()
  expect(text, "an empty value reached the page as a raw `undefined`").not.toContain("undefined")
  expect(text, "an empty value reached the page as a raw `NaN`").not.toContain("NaN")
})
