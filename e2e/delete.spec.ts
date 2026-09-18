import { expect, test, type Page } from "@playwright/test"

const SAVE_STATUS = '[aria-live="polite"]'

const INDUSTRY = "Direct-to-consumer skincare"
const AUDIENCE = "Eco-conscious millennials"

/**
 * Delete lives in the canvas header now, so reaching it is just "create a
 * blueprint and type something" — there is no wizard to walk through.
 * Waits for "Saved" so the record on disk matches what the page shows.
 */
async function createBlueprintWithContent(page: Page, clientName: string): Promise<string> {
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
  const blueprintId = page.url().split("/blueprint/")[1]

  await page.getByLabel("Industry", { exact: true }).fill(INDUSTRY)
  await page.getByLabel("Audience", { exact: true }).fill(AUDIENCE)
  await expect(page.locator(SAVE_STATUS)).toHaveText("Saved")

  return blueprintId
}

test("deleting from the header navigates home and 404s the old URL", async ({ page }) => {
  const blueprintId = await createBlueprintWithContent(page, `Delete Me ${Date.now()}`)

  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Delete", exact: true }).click()

  await page.waitForURL("/")

  await page.goto(`/blueprint/${blueprintId}`)
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible()
  await expect(page.getByText("This page could not be found.")).toBeVisible()
})

test("dismissing the delete confirmation keeps the blueprint and stays on the page", async ({
  page,
}) => {
  const blueprintId = await createBlueprintWithContent(page, `Keep Me ${Date.now()}`)

  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Delete", exact: true }).click()

  await expect(page).toHaveURL(`/blueprint/${blueprintId}`)
  await expect(page.getByLabel("Industry", { exact: true })).toHaveValue(INDUSTRY)
  await expect(page.getByLabel("Audience", { exact: true })).toHaveValue(AUDIENCE)

  // A reload re-reads the record: proof no DELETE reached the server.
  await page.reload()
  await expect(page.getByLabel("Industry", { exact: true })).toHaveValue(INDUSTRY)
  await expect(page.getByLabel("Audience", { exact: true })).toHaveValue(AUDIENCE)
})
