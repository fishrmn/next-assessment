import { expect, test, type Locator, type Page } from "@playwright/test"

/** `ALL_FIELDS.length` — the denominator the header prints. */
const TOTAL_FIELDS = 9

const VALUES = {
  industry: "Direct-to-consumer skincare",
  audience: "Eco-conscious millennials",
  competitor: "Glossier",
  differentiators: "Clean ingredients, radical transparency",
  visualStyle: "Minimal, editorial, warm",
  colorDirection: "Navy and terracotta",
  typographyDirection: "Clean sans-serif",
  toneOfVoice: "Warm, direct, a little irreverent",
  trait: "Playful",
}

/** Every text/area field, by label, in document order. */
const TEXT_LABELS = [
  "Industry",
  "Audience",
  "Differentiators",
  "Visual style",
  "Color direction",
  "Typography",
  "Tone of voice",
] as const

function field(page: Page, label: string): Locator {
  return page.getByLabel(label, { exact: true })
}

function saveStatus(page: Page): Locator {
  return page.locator('[aria-live="polite"]')
}

/**
 * The filled bar inside the header. It carries no role or label of its own, so
 * it is addressed by the one thing that is actually part of its contract: an
 * inline percentage width. Asserting the attribute (not `getComputedStyle`,
 * which resolves to pixels) is the only way to compare against a percentage.
 */
function progressBar(page: Page): Locator {
  return page.getByRole("banner").locator('div[style*="%"]')
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

/** Types every field in place. No steps, no Next — one scrolling document. */
async function fillDocument(page: Page) {
  await field(page, "Industry").fill(VALUES.industry)
  await field(page, "Audience").fill(VALUES.audience)
  await field(page, "Competitors").fill(VALUES.competitor)
  await field(page, "Competitors").press("Enter")
  await field(page, "Differentiators").fill(VALUES.differentiators)
  await field(page, "Visual style").fill(VALUES.visualStyle)
  await field(page, "Color direction").fill(VALUES.colorDirection)
  await field(page, "Typography").fill(VALUES.typographyDirection)
  await field(page, "Tone of voice").fill(VALUES.toneOfVoice)
  // Committed last, so it is the value that gates on the final save.
  await field(page, "Personality").fill(VALUES.trait)
  await field(page, "Personality").press("Enter")
}

async function expectDocument(page: Page, clientName: string) {
  await expect(field(page, "Blueprint title")).toHaveValue(clientName)
  await expect(field(page, "Industry")).toHaveValue(VALUES.industry)
  await expect(field(page, "Audience")).toHaveValue(VALUES.audience)
  await expect(field(page, "Differentiators")).toHaveValue(VALUES.differentiators)
  await expect(field(page, "Visual style")).toHaveValue(VALUES.visualStyle)
  await expect(field(page, "Color direction")).toHaveValue(VALUES.colorDirection)
  await expect(field(page, "Typography")).toHaveValue(VALUES.typographyDirection)
  await expect(field(page, "Tone of voice")).toHaveValue(VALUES.toneOfVoice)
  // Chips are asserted through their remove buttons: the chip text alone also
  // appears in the live voice sample, so it is not a unique locator.
  await expect(page.getByRole("button", { name: `Remove ${VALUES.competitor}` })).toBeVisible()
  await expect(page.getByRole("button", { name: `Remove ${VALUES.trait}` })).toBeVisible()
}

async function expectProgress(page: Page, filled: number) {
  const pct = Math.round((filled / TOTAL_FIELDS) * 100)
  await expect(page.getByText(`${filled} of ${TOTAL_FIELDS} fields`)).toBeVisible()
  await expect(progressBar(page)).toHaveAttribute("style", new RegExp(`width:\\s*${pct}%`))
}

test("creates a blueprint and persists every field across a reload", async ({ page }) => {
  const clientName = await createBlueprint(page, "Acme Skincare")

  const saved = savedPatch(page, VALUES.trait)
  await fillDocument(page)
  await saved
  await expect(saveStatus(page)).toHaveText("Saved")

  await expectDocument(page, clientName)

  await page.reload()
  await expectDocument(page, clientName)
})

test("saves a single filled field without the rest of the document", async ({ page }) => {
  // The headline capability of the canvas: the old wizard backend rejected any
  // incomplete section, so a lone value could not be persisted at all.
  await createBlueprint(page, "Partial Save Co")

  const saved = savedPatch(page, VALUES.industry)
  await field(page, "Industry").fill(VALUES.industry)
  await saved
  await expect(saveStatus(page)).toHaveText("Saved")

  await page.reload()

  await expect(field(page, "Industry")).toHaveValue(VALUES.industry)
  for (const label of TEXT_LABELS.filter((it) => it !== "Industry")) {
    await expect(field(page, label)).toHaveValue("")
  }
  await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0)
  await expect(page.getByText(`1 of ${TOTAL_FIELDS} fields`)).toBeVisible()
})

test("replaces a previously saved value on a second edit", async ({ page }) => {
  const first = "Boutique coffee roaster"
  const second = "Speciality tea importer"
  await createBlueprint(page, "Rewrite Co")

  const firstSaved = savedPatch(page, first)
  await field(page, "Industry").fill(first)
  await firstSaved
  await page.reload()
  await expect(field(page, "Industry")).toHaveValue(first)

  const secondSaved = savedPatch(page, second)
  await field(page, "Industry").fill(second)
  await secondSaved
  await page.reload()
  await expect(field(page, "Industry")).toHaveValue(second)
})

test("persists a title edited in the header as the client name", async ({ page }) => {
  await createBlueprint(page, "Original Name Co")
  const renamed = `Renamed Studio ${Date.now()}`

  const saved = savedPatch(page, renamed)
  await field(page, "Blueprint title").fill(renamed)
  await saved

  await page.reload()
  await expect(field(page, "Blueprint title")).toHaveValue(renamed)
})

test("updates the progress label and bar as fields are filled", async ({ page }) => {
  await createBlueprint(page, "Progress Co")

  await expectProgress(page, 0)

  await field(page, "Industry").fill(VALUES.industry)
  await expectProgress(page, 1)

  await field(page, "Audience").fill(VALUES.audience)
  await expectProgress(page, 2)
})

test("adds a chip on Enter and persists it across a reload", async ({ page }) => {
  await createBlueprint(page, "Chip Add Co")
  const remove = page.getByRole("button", { name: `Remove ${VALUES.trait}` })

  const saved = savedPatch(page, VALUES.trait)
  await field(page, "Personality").fill(VALUES.trait)
  await field(page, "Personality").press("Enter")
  await expect(remove).toBeVisible()
  // The draft input clears; only committed values reach the document.
  await expect(field(page, "Personality")).toHaveValue("")
  await saved

  await page.reload()
  await expect(remove).toBeVisible()
})

test("removes a chip with its × button and the removal persists", async ({ page }) => {
  await createBlueprint(page, "Chip Remove Co")
  const remove = page.getByRole("button", { name: `Remove ${VALUES.competitor}` })

  const added = savedPatch(page, VALUES.competitor)
  await field(page, "Competitors").fill(VALUES.competitor)
  await field(page, "Competitors").press("Enter")
  await added

  const cleared = savedPatch(page, '"competitors":[]')
  await remove.click()
  await expect(remove).toHaveCount(0)
  await cleared

  await page.reload()
  await expect(remove).toHaveCount(0)
})

test("derives palette swatches from the color direction as it is typed", async ({ page }) => {
  await createBlueprint(page, "Palette Co")

  await expect(page.getByText("No colors named yet — showing the house palette.")).toBeVisible()

  await field(page, "Color direction").fill("navy and terracotta")

  await expect(page.getByText("#1f2f4d")).toBeVisible()
  await expect(page.getByText("#b25c41")).toBeVisible()
})

test("derives a type specimen label from the typography direction as it is typed", async ({
  page,
}) => {
  await createBlueprint(page, "Type Co")

  await expect(page.getByText("Not specified — showing the house serif")).toBeVisible()

  await field(page, "Typography").fill("clean sans-serif")

  await expect(page.getByText("Sans-serif — clear, contemporary")).toBeVisible()
})
