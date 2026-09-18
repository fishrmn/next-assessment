import { expect, test, type Locator, type Page } from "@playwright/test"

/** iPhone 12/13/14 logical size — the reference phone for the layout. */
const PHONE = { width: 390, height: 844 }
/** iPhone SE (1st gen) — the smallest width still worth supporting. */
const SMALL_PHONE = { width: 320, height: 568 }
/** Above the `lg` (1024px) breakpoint, where the two-column layout applies. */
const DESKTOP = { width: 1440, height: 900 }

const INDUSTRY = "Direct-to-consumer skincare"
const COLOR_DIRECTION = "navy and terracotta"
/** `derivePalette("navy and terracotta")` — the swatch the user should see. */
const NAVY_HEX = "#1f2f4d"

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
 * from the previous write while the next debounce is pending. Register this
 * *before* typing, await it after.
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

/**
 * A page that scrolls sideways on a phone is broken in the way users notice
 * first. Reported with both measurements so a regression says how far over it
 * went, not just that it did.
 */
async function expectNoHorizontalOverflow(page: Page, where: string): Promise<void> {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(
    scrollWidth,
    `${where}: documentElement.scrollWidth ${scrollWidth}px exceeds window.innerWidth ${innerWidth}px (overflow ${scrollWidth - innerWidth}px)`
  ).toBeLessThanOrEqual(innerWidth)
}

async function box(locator: Locator): Promise<{ x: number; y: number; width: number }> {
  const measured = await locator.boundingBox()
  expect(measured, "element is not laid out — boundingBox() returned null").not.toBeNull()
  return measured ?? { x: 0, y: 0, width: 0 }
}

test("has no horizontal overflow at 390px on the home page or a blueprint", async ({ page }) => {
  await page.setViewportSize(PHONE)

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Every brand begins with a blueprint" }))
    .toBeVisible()
  await expectNoHorizontalOverflow(page, `home page at ${PHONE.width}px`)

  await createBlueprint(page, "Mobile Overflow")
  await expect(page.getByRole("heading", { name: "Business Context" })).toBeVisible()
  await expectNoHorizontalOverflow(page, `blueprint at ${PHONE.width}px`)
})

test("has no horizontal overflow at 320px on the home page or a blueprint", async ({ page }) => {
  await page.setViewportSize(SMALL_PHONE)

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Every brand begins with a blueprint" }))
    .toBeVisible()
  await expectNoHorizontalOverflow(page, `home page at ${SMALL_PHONE.width}px`)

  await createBlueprint(page, "Small Phone Overflow")
  await expect(page.getByRole("heading", { name: "Business Context" })).toBeVisible()
  await expectNoHorizontalOverflow(page, `blueprint at ${SMALL_PHONE.width}px`)
})

test("edits a blueprint at 390px and persists it across a reload", async ({ page }) => {
  await page.setViewportSize(PHONE)
  await createBlueprint(page, "Mobile Editing")

  const saved = savedPatch(page, COLOR_DIRECTION)
  await field(page, "Industry").fill(INDUSTRY)
  await field(page, "Color direction").fill(COLOR_DIRECTION)
  await saved
  await expect(saveStatus(page)).toHaveText("Saved")

  await page.reload()

  await expect(field(page, "Industry")).toHaveValue(INDUSTRY)
  await expect(field(page, "Color direction")).toHaveValue(COLOR_DIRECTION)
})

test("keeps the live artifacts visible and deriving at 390px", async ({ page }) => {
  // The artifacts are the "watch it take shape" requirement, so a mobile layout
  // that drops them to save room has removed the feature, not the decoration.
  await page.setViewportSize(PHONE)
  await createBlueprint(page, "Mobile Artifacts")

  await expect(page.getByText("Palette", { exact: true })).toBeVisible()
  await expect(page.getByText("Type specimen", { exact: true })).toBeVisible()
  await expect(page.getByText("Voice sample", { exact: true })).toBeVisible()

  await field(page, "Color direction").fill(COLOR_DIRECTION)

  await expect(page.getByText(NAVY_HEX)).toBeVisible()
})

test("lays the artifacts beside the document at 1440px", async ({ page }) => {
  await page.setViewportSize(DESKTOP)
  await createBlueprint(page, "Desktop Columns")

  await expect(page.getByRole("heading", { name: "Business Context" })).toBeVisible()
  await expectNoHorizontalOverflow(page, `blueprint at ${DESKTOP.width}px`)

  // Geometry, not class names: the aside has to start past the right edge of
  // the document column and start level with it, which is exactly what a
  // single-column stack at this width would not do.
  const aside = await box(page.getByRole("complementary").filter({ visible: true }).first())
  // `.bp-in` is `width: 100%`, so a field control spans the document column.
  const document = await box(field(page, "Industry"))
  const documentRight = document.x + document.width

  expect(
    aside.x,
    `artifacts aside starts at x=${aside.x}px, but the document column ends at x=${documentRight}px — the layout is not two-column`
  ).toBeGreaterThanOrEqual(documentRight)
  expect(
    aside.y,
    `artifacts aside starts at y=${aside.y}px, below the document's first field at y=${document.y}px — it is stacked, not beside`
  ).toBeLessThan(document.y)
})
