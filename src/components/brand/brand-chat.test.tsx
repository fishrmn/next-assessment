import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { PageConfig } from "@/components/builder/types"
import type {
  BrandDirection,
  BrandProfile,
  BrandTurnResult,
} from "@/lib/ai/brand-types"

import { BrandChat } from "./brand-chat"

vi.mock("@/app/actions", () => ({
  brandChatAction: vi.fn(),
  createBrandPageAction: vi.fn(),
}))

async function mockedActions() {
  const actions = await import("@/app/actions")
  return {
    chat: vi.mocked(actions.brandChatAction),
    create: vi.mocked(actions.createBrandPageAction),
  }
}

const profile: BrandProfile = {
  salonName: "Maison Belle",
  services: ["Cuts"],
  vibeWords: ["modern", "premium"],
  personality: { modernClassic: "modern", luxuryApproachable: "luxury" },
  palette: {
    primary: "#b3854d",
    secondary: "#f5eee6",
    accent: "#2e211b",
    background: "#faf7f0",
  },
  paletteReasoning: "Warm golds suit a premium salon.",
}

const directions: BrandDirection[] = [
  {
    id: "a",
    name: "Luxury Spa Retreat",
    baseTemplateId: "elegance",
    visualDescription: "Ivory and gold",
    layoutApproach: "Centered",
    typography: "Serif",
    colorUsage: "Gold CTAs",
    heroConcept: "Side image",
  },
  {
    id: "b",
    name: "Modern Studio",
    baseTemplateId: "moderna",
    visualDescription: "Dusty rose",
    layoutApproach: "Left-aligned",
    typography: "Modern serif",
    colorUsage: "Rose blocks",
    heroConcept: "Portrait",
  },
  {
    id: "c",
    name: "Glow Bar",
    baseTemplateId: "lush",
    visualDescription: "Playful",
    layoutApproach: "Photo-heavy",
    typography: "Rounded",
    colorUsage: "Pink",
    heroConcept: "Team photo",
  },
]

const pageConfig: PageConfig = [
  { id: "h1", type: "hero", heading: "Maison Belle", align: "center" },
]

function turn(overrides: Partial<BrandTurnResult>): { ok: true; data: BrandTurnResult } {
  return {
    ok: true,
    data: { message: "Noted!", state: {}, ...overrides },
  }
}

function sendMessage(text: string) {
  fireEvent.change(screen.getByLabelText("Message the brand assistant"), {
    target: { value: text },
  })
  fireEvent.click(screen.getByRole("button", { name: "Send message" }))
}

describe("BrandChat", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the greeting and renders both sides of the conversation", async () => {
    const { chat } = await mockedActions()
    chat.mockResolvedValue(turn({ message: "Great — who are your ideal clients?" }))

    render(<BrandChat />)
    expect(screen.getByText(/I'm your brand consultant/)).toBeDefined()

    sendMessage("My salon is Maison Belle")

    expect(await screen.findByText("Great — who are your ideal clients?")).toBeDefined()
    expect(screen.getByText("My salon is Maison Belle")).toBeDefined()
    expect(chat).toHaveBeenCalledWith({
      messages: [
        expect.objectContaining({ role: "assistant" }),
        expect.objectContaining({ role: "user", text: "My salon is Maison Belle" }),
      ],
      state: {},
    })
  })

  it("renders the palette card when a profile arrives", async () => {
    const { chat } = await mockedActions()
    chat.mockResolvedValue(
      turn({ message: "Here is your profile", profile, state: { profile } })
    )

    render(<BrandChat />)
    sendMessage("modern premium")

    expect(await screen.findByTestId("palette-card")).toBeDefined()
    expect(screen.getByText("Maison Belle — brand profile")).toBeDefined()
    expect(screen.getByText(/Warm golds suit/)).toBeDefined()
  })

  it("renders three direction cards and sends the choice as a message", async () => {
    const { chat } = await mockedActions()
    chat.mockResolvedValueOnce(
      turn({
        message: "Pick one!",
        directions: [...directions],
        state: { profile, directions: [...directions] },
      })
    )

    render(<BrandChat />)
    sendMessage("show me directions")

    const chooseButtons = await screen.findAllByRole("button", {
      name: "Choose this direction",
    })
    expect(chooseButtons).toHaveLength(3)

    chat.mockResolvedValueOnce(
      turn({
        message: "Your page is ready",
        page: { config: pageConfig, summary: "Your page is ready" },
        state: { profile, directions: [...directions] },
      })
    )
    fireEvent.click(chooseButtons[0])

    expect(await screen.findByTestId("generated-page-card")).toBeDefined()
    const lastCall = chat.mock.calls.at(-1)![0]
    expect(lastCall.messages.at(-1)).toMatchObject({
      role: "user",
      text: "I choose direction a: Luxury Spa Retreat",
    })
  })

  it("creates the page from the generated card", async () => {
    const { chat, create } = await mockedActions()
    chat.mockResolvedValue(
      turn({
        message: "Ready",
        page: { config: pageConfig, summary: "Ready" },
        state: { profile },
      })
    )
    create.mockResolvedValue({ ok: false, error: "nope" })

    render(<BrandChat />)
    sendMessage("generate it")

    await screen.findByTestId("generated-page-card")
    // Name prefilled from the profile.
    const nameInput = screen.getByLabelText("Page name") as HTMLInputElement
    expect(nameInput.value).toBe("Maison Belle")

    fireEvent.click(
      screen.getByRole("button", { name: "Create page & open editor" })
    )
    expect(await screen.findByRole("alert")).toBeDefined()
    expect(create).toHaveBeenCalledWith({
      name: "Maison Belle",
      config: pageConfig,
    })
    // Composer is disabled after generation.
    expect(
      (screen.getByLabelText("Message the brand assistant") as HTMLTextAreaElement)
        .disabled
    ).toBe(true)
  })

  it("shows action errors as alerts", async () => {
    const { chat } = await mockedActions()
    chat.mockResolvedValue({ ok: false, error: "The brand assistant hit a snag." })

    render(<BrandChat />)
    sendMessage("hello")

    expect(await screen.findByRole("alert")).toBeDefined()
  })
})
