import { describe, expect, it, vi } from "vitest"
import type OpenAI from "openai"

import { runBrandAgent } from "./brand-agent"
import type { BrandChatMessage, BrandState } from "./brand-types"

vi.mock("server-only", () => ({}))

type FakeMessage = {
  content: string | null
  tool_calls?: {
    id: string
    type: "function"
    function: { name: string; arguments: string }
  }[]
}

type CreateBody = {
  messages: { role: string; content?: unknown; tool_call_id?: string }[]
}

function fakeOpenAI(script: FakeMessage[]) {
  const create = vi.fn(async (body: CreateBody) => {
    void body
    return { choices: [{ message: script.shift() ?? { content: "Done." } }] }
  })
  return {
    client: { chat: { completions: { create } } } as unknown as OpenAI,
    create,
  }
}

function toolCall(id: string, name: string, args: unknown) {
  return {
    id,
    type: "function" as const,
    function: { name, arguments: JSON.stringify(args) },
  }
}

const profile = {
  salonName: "Maison Belle",
  services: ["Cuts", "Color"],
  vibeWords: ["modern", "premium", "feminine"],
  personality: { modernClassic: "modern", luxuryApproachable: "luxury" },
  palette: {
    primary: "#b3854d",
    secondary: "#f5eee6",
    accent: "#2e211b",
    background: "#faf7f0",
  },
  paletteReasoning: "Warm golds from the logo.",
}

const directions = [
  {
    id: "a",
    name: "Luxury Spa Retreat",
    baseTemplateId: "elegance",
    visualDescription: "Ivory and gold",
    layoutApproach: "Centered, airy",
    typography: "Serif headings",
    colorUsage: "Gold CTAs on ivory",
    heroConcept: "Side image of treatments",
  },
  {
    id: "b",
    name: "Modern Beauty Studio",
    baseTemplateId: "moderna",
    visualDescription: "Dusty rose editorial",
    layoutApproach: "Left-aligned blocks",
    typography: "Modern serif",
    colorUsage: "Rose hero, espresso CTA",
    heroConcept: "Portrait beside text",
  },
  {
    id: "c",
    name: "Friendly Glow Bar",
    baseTemplateId: "lush",
    visualDescription: "Playful pink",
    layoutApproach: "Photo-heavy",
    typography: "Rounded sans",
    colorUsage: "Pink accents everywhere",
    heroConcept: "Team photo hero",
  },
]

const userTurn = (text: string): BrandChatMessage[] => [{ role: "user", text }]

describe("runBrandAgent", () => {
  it("returns a plain conversational reply without changing state", async () => {
    const { client } = fakeOpenAI([
      { content: "Lovely! What services do you offer?" },
    ])

    const result = await runBrandAgent(userTurn("My salon is Maison Belle"), {}, client)

    expect(result.message).toBe("Lovely! What services do you offer?")
    expect(result.state).toEqual({})
    expect(result.profile).toBeUndefined()
    expect(result.page).toBeUndefined()
  })

  it("saves a valid brand profile and returns it as an artifact", async () => {
    const { client } = fakeOpenAI([
      { content: null, tool_calls: [toolCall("c1", "set_brand_profile", { profile })] },
      { content: "Here is your brand profile — the gold palette matches your logo." },
    ])

    const result = await runBrandAgent(userTurn("modern premium feminine"), {}, client)

    expect(result.profile?.salonName).toBe("Maison Belle")
    expect(result.state.profile?.salonName).toBe("Maison Belle")
    expect(result.message).toContain("brand profile")
  })

  it("feeds validation errors back so the model can self-correct", async () => {
    const badProfile = { ...profile, palette: { ...profile.palette, accent: "gold" } }
    const { client, create } = fakeOpenAI([
      { content: null, tool_calls: [toolCall("c1", "set_brand_profile", { profile: badProfile })] },
      { content: null, tool_calls: [toolCall("c2", "set_brand_profile", { profile })] },
      { content: "Saved!" },
    ])

    const result = await runBrandAgent(userTurn("save it"), {}, client)

    expect(result.profile?.salonName).toBe("Maison Belle")
    const messages = create.mock.calls[1]![0].messages
    const firstToolReply = messages.find((m) => m.tool_call_id === "c1")!
    expect(String(firstToolReply.content)).toContain("Error:")
  })

  it("rejects directions before a profile exists and accepts them after", async () => {
    const { client } = fakeOpenAI([
      { content: null, tool_calls: [toolCall("c1", "propose_directions", { directions })] },
      { content: "Let me get your profile first — what's your salon called?" },
    ])

    const noProfile = await runBrandAgent(userTurn("show me directions"), {}, client)
    expect(noProfile.directions).toBeUndefined()

    const { client: client2 } = fakeOpenAI([
      { content: null, tool_calls: [toolCall("c1", "propose_directions", { directions })] },
      { content: "Which direction speaks to you?" },
    ])
    const withProfile = await runBrandAgent(
      userTurn("show me directions"),
      { profile: profile as BrandState["profile"] },
      client2
    )
    expect(withProfile.directions).toHaveLength(3)
    expect(withProfile.state.directions).toHaveLength(3)
  })

  it("generates the page from the chosen direction via the edit agent", async () => {
    const { client, create } = fakeOpenAI([
      // Brand agent turn: model picks generate_page.
      {
        content: null,
        tool_calls: [
          toolCall("c1", "generate_page", {
            directionId: "a",
            rebrandInstruction: "Rebrand everything for Maison Belle",
          }),
        ],
      },
      // Nested runEditAgent rounds (same fake client serves both loops).
      {
        content: null,
        tool_calls: [
          toolCall("e1", "update_element", { id: "PLACEHOLDER", patch: {} }),
        ],
      },
      { content: "Rebranded the hero." },
    ])

    // The nested edit agent targets ids generated at runtime; patch the script's
    // placeholder by intercepting the first nested call instead.
    const state: BrandState = {
      profile: profile as BrandState["profile"],
      directions: directions as BrandState["directions"],
    }
    const result = await runBrandAgent(userTurn("I choose direction a"), state, client)

    expect(result.page).toBeDefined()
    expect(result.page!.summary).toContain("Luxury Spa Retreat")
    // The page derives from the elegance template (navbar, then hero).
    expect(result.page!.config[0]).toMatchObject({ type: "navbar" })
    expect(result.page!.config[1]).toMatchObject({ type: "hero" })
    expect(result.message).toBe(result.page!.summary)
    // Outer call + 2 nested edit-agent calls.
    expect(create).toHaveBeenCalledTimes(3)
  })

  it("places the uploaded logo into the generated navbar", async () => {
    const { client } = fakeOpenAI([
      {
        content: null,
        tool_calls: [
          toolCall("c1", "generate_page", {
            directionId: "a",
            rebrandInstruction: "Rebrand everything",
          }),
        ],
      },
      { content: "Done rebranding." },
    ])

    const messages: BrandChatMessage[] = [
      { role: "user", text: "here is my logo", imageDataUrl: "data:image/jpeg;base64,LOGO" },
      { role: "assistant", text: "Beautiful!" },
      { role: "user", text: "I choose direction a" },
    ]
    const result = await runBrandAgent(
      messages,
      { profile: profile as BrandState["profile"], directions: directions as BrandState["directions"] },
      client
    )

    const navbar = result.page!.config.find((el) => el.type === "navbar")
    expect(navbar).toMatchObject({ logoUrl: "data:image/jpeg;base64,LOGO" })
  })

  it("returns an error to the model for an unknown direction id", async () => {
    const { client, create } = fakeOpenAI([
      {
        content: null,
        tool_calls: [
          toolCall("c1", "generate_page", {
            directionId: "z",
            rebrandInstruction: "Rebrand it",
          }),
        ],
      },
      { content: "Please pick one of the three directions I proposed." },
    ])

    const result = await runBrandAgent(
      userTurn("go"),
      { profile: profile as BrandState["profile"], directions: directions as BrandState["directions"] },
      client
    )

    expect(result.page).toBeUndefined()
    const secondCall = create.mock.calls[1]![0]
    expect(String(secondCall.messages.at(-1)!.content)).toContain("Error:")
  })

  it("stops at the iteration cap with a fallback message", async () => {
    const endless: FakeMessage[] = Array.from({ length: 10 }, (_, i) => ({
      content: null,
      tool_calls: [toolCall(`c${i}`, "set_brand_profile", { profile })],
    }))
    const { client, create } = fakeOpenAI(endless)

    const result = await runBrandAgent(userTurn("loop"), {}, client)

    expect(create).toHaveBeenCalledTimes(4)
    expect(result.message).toBeTruthy()
    expect(result.state.profile).toBeDefined()
  })

  it("sends the latest logo as an image content part and collapses older ones", async () => {
    const { client, create } = fakeOpenAI([{ content: "Nice logo!" }])

    const messages: BrandChatMessage[] = [
      { role: "user", text: "old logo", imageDataUrl: "data:image/jpeg;base64,OLD" },
      { role: "assistant", text: "Tell me more" },
      { role: "user", text: "new logo", imageDataUrl: "data:image/jpeg;base64,NEW" },
    ]
    await runBrandAgent(messages, {}, client)

    const sent = create.mock.calls[0]![0].messages
    const userMessages = sent.filter((m) => m.role === "user")
    expect(userMessages[0].content).toContain("[logo image was attached]")
    const parts = userMessages[1].content as { type: string; image_url?: { url: string } }[]
    expect(parts.some((p) => p.type === "image_url" && p.image_url?.url.includes("NEW"))).toBe(true)
  })
})
