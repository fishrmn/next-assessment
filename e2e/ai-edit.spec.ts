import { expect, test, type Page } from "@playwright/test"
import type { AiEditResult } from "@/services/blueprint-ai.types"

/**
 * Every test here mocks `POST /api/blueprints/:id/ai-edit` — the suite must
 * never reach OpenAI. The assertions are about what the canvas does with the
 * response, not about what a model would say.
 */
const AI_EDIT_ROUTE = "**/api/blueprints/*/ai-edit"

/** Constant across both modes, unlike the sr-only label and the button. */
const PROMPT_PLACEHOLDER = "Describe your brand in a sentence or two — AI fills the blanks."

const SAVE_STATUS = '[aria-live="polite"]'

type AiEditPayload = {
  businessContext?: Partial<AiEditResult["businessContext"]>
  brandExpression?: Partial<AiEditResult["brandExpression"]>
}

type PostedBody = { instruction: string; mode: string }

/** A brand-new blueprint: no field has content, so the prompt is in "generate". */
async function createBlueprint(page: Page, clientName: string): Promise<void> {
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
  await expect(page.getByPlaceholder(PROMPT_PLACEHOLDER)).toBeVisible()
}

/**
 * Intercepts the AI endpoint and records what the canvas posted, so a test can
 * assert the request as well as the rendering.
 */
async function mockAiEdit(
  page: Page,
  response: { status?: number; body: AiEditPayload | { error: string } },
): Promise<PostedBody[]> {
  const posted: PostedBody[] = []

  await page.route(AI_EDIT_ROUTE, async (route) => {
    posted.push(route.request().postDataJSON() as PostedBody)
    await route.fulfill({
      status: response.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    })
  })

  return posted
}

async function submitPrompt(page: Page, instruction: string, buttonName: string): Promise<void> {
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill(instruction)
  await page.getByRole("button", { name: buttonName }).click()
}

const GENERATED = {
  businessContext: {
    industry: "Specialty coffee roasting",
    audience: "Independent café owners",
    competitors: ["Blue Bottle"],
    differentiators: "Single-origin beans roasted to order",
  },
  brandExpression: {
    visualStyle: "Warm, tactile, unfussy",
    // Names navy / gold / cream, so the palette has something to read.
    colorDirection: "Deep navy with warm gold over a cream ground",
    typographyDirection: "Clean sans-serif for clarity",
    toneOfVoice: "Warm, direct, never precious.",
    personality: ["Grounded", "Curious"],
  },
}

test("a mocked AI generation fills the document fields and the live artifacts", async ({ page }) => {
  await createBlueprint(page, `AI Generate Co ${Date.now()}`)
  await mockAiEdit(page, { body: GENERATED })

  await submitPrompt(
    page,
    "A specialty coffee roaster for independent cafés, warm and direct.",
    "Generate with AI",
  )

  // The document itself — every field is an in-place control on the canvas.
  await expect(page.getByLabel("Industry", { exact: true })).toHaveValue(
    GENERATED.businessContext.industry,
  )
  await expect(page.getByLabel("Audience", { exact: true })).toHaveValue(
    GENERATED.businessContext.audience,
  )
  await expect(page.getByLabel("Differentiators", { exact: true })).toHaveValue(
    GENERATED.businessContext.differentiators,
  )
  await expect(page.getByLabel("Visual style", { exact: true })).toHaveValue(
    GENERATED.brandExpression.visualStyle,
  )
  await expect(page.getByLabel("Color direction", { exact: true })).toHaveValue(
    GENERATED.brandExpression.colorDirection,
  )
  await expect(page.getByLabel("Typography", { exact: true })).toHaveValue(
    GENERATED.brandExpression.typographyDirection,
  )
  await expect(page.getByLabel("Tone of voice", { exact: true })).toHaveValue(
    GENERATED.brandExpression.toneOfVoice,
  )

  // Chip fields render committed values as tags, not as input values.
  const sections = page.locator("section.bp-section")
  await expect(sections.getByText("Blue Bottle")).toBeVisible()
  await expect(sections.getByText("Grounded")).toBeVisible()
  await expect(sections.getByText("Curious")).toBeVisible()

  // The artifacts column re-derives from the same draft, live.
  const artifacts = page.getByRole("complementary")
  await expect(artifacts.getByText("#1f2f4d")).toBeVisible() // navy
  await expect(artifacts.getByText("#b68235")).toBeVisible() // gold
  await expect(artifacts.getByText("Read from your color direction.")).toBeVisible()
  await expect(artifacts.getByText("Sans-serif — clear, contemporary")).toBeVisible()
  await expect(
    artifacts.getByText("grounded and curious, Warm, direct, never precious."),
  ).toBeVisible()
})

test("a 502 from the AI endpoint shows an inline error and leaves the document unchanged", async ({
  page,
}) => {
  await createBlueprint(page, `AI Failure Co ${Date.now()}`)
  await mockAiEdit(page, {
    status: 502,
    body: { error: "AI could not generate a Blueprint update" },
  })

  await submitPrompt(
    page,
    "A specialty coffee roaster for independent cafés, warm and direct.",
    "Generate with AI",
  )

  await expect(page.getByText("AI could not generate a Blueprint update")).toBeVisible()

  for (const label of [
    "Industry",
    "Audience",
    "Differentiators",
    "Visual style",
    "Color direction",
    "Typography",
    "Tone of voice",
  ]) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue("")
  }

  // Nothing reached the draft, so the artifacts are still in their empty state
  // and the prompt is still offering to generate rather than to revise.
  await expect(
    page.getByRole("complementary").getByText("No colors named yet — showing the house palette."),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Generate with AI" })).toBeVisible()
})

test("the prompt switches to Update with AI once a field has content and posts mode revise", async ({
  page,
}) => {
  await createBlueprint(page, `AI Mode Co ${Date.now()}`)

  await expect(page.getByRole("button", { name: "Generate with AI" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Update with AI" })).toHaveCount(0)

  await page.getByLabel("Industry", { exact: true }).fill("Specialty coffee roasting")

  await expect(page.getByRole("button", { name: "Update with AI" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Generate with AI" })).toHaveCount(0)

  const posted = await mockAiEdit(page, { body: { businessContext: {}, brandExpression: {} } })
  await submitPrompt(page, "Make the tone warmer.", "Update with AI")

  // The prompt clears only after a successful apply — a deterministic signal
  // that the request round-tripped.
  await expect(page.getByPlaceholder(PROMPT_PLACEHOLDER)).toHaveValue("")
  expect(posted).toHaveLength(1)
  expect(posted[0]).toEqual({ instruction: "Make the tone warmer.", mode: "revise" })
})

test("a revise that changes one field leaves the other filled fields byte-identical", async ({
  page,
}) => {
  await createBlueprint(page, `AI Revise Co ${Date.now()}`)

  const visualStyle = "Warm, tactile, unfussy — never precious"
  await page.getByLabel("Industry", { exact: true }).fill("Specialty coffee roasting")
  await page.getByLabel("Visual style", { exact: true }).fill(visualStyle)
  await expect(page.locator(SAVE_STATUS)).toHaveText("Saved")

  // The mocked revise rewrites `industry` and nothing else. The canvas merges
  // an AI result over the current draft, so every key the response leaves out
  // has to survive untouched — the clobber risk the plan names.
  await mockAiEdit(page, {
    body: {
      businessContext: { industry: "Small-batch coffee roasting" },
      brandExpression: {},
    },
  })

  await submitPrompt(page, "Call it small-batch, not specialty.", "Update with AI")

  await expect(page.getByLabel("Industry", { exact: true })).toHaveValue(
    "Small-batch coffee roasting",
  )
  await expect(page.getByLabel("Visual style", { exact: true })).toHaveValue(visualStyle)
})
