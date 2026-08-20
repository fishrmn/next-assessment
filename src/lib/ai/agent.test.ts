import { describe, expect, it, vi } from "vitest"
import type OpenAI from "openai"

import type { PageConfig } from "@/components/builder/types"

import { runEditAgent } from "./agent"

vi.mock("server-only", () => ({}))

const config: PageConfig = [
  { id: "hero-1", type: "hero", heading: "Welcome", align: "center" },
  { id: "text-1", type: "text", text: "About us", level: "p", align: "left" },
]

type FakeMessage = {
  content: string | null
  tool_calls?: {
    id: string
    type: "function"
    function: { name: string; arguments: string }
  }[]
}

/** Builds a fake OpenAI client whose completions return the scripted messages in order. */
type CreateBody = {
  messages: { role: string; tool_call_id?: string; content?: unknown }[]
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

describe("runEditAgent", () => {
  it("applies tool calls across rounds and returns the final summary", async () => {
    const { client, create } = fakeOpenAI([
      {
        content: null,
        tool_calls: [
          toolCall("c1", "update_element", {
            id: "hero-1",
            patch: { backgroundColor: "#111827", textColor: "#f9fafb" },
          }),
        ],
      },
      {
        content: null,
        tool_calls: [
          toolCall("c2", "update_element", { id: "text-1", patch: { level: "h2" } }),
        ],
      },
      { content: "Darkened the hero and enlarged the headline." },
    ])

    const result = await runEditAgent(config, "make the hero darker", client)

    expect(result.changed).toBe(true)
    expect(result.summary).toBe("Darkened the hero and enlarged the headline.")
    expect(result.config[0]).toMatchObject({ backgroundColor: "#111827" })
    expect(result.config[1]).toMatchObject({ level: "h2" })
    expect(create).toHaveBeenCalledTimes(3)
  })

  it("feeds validation errors back to the model without mutating", async () => {
    const { client, create } = fakeOpenAI([
      {
        content: null,
        tool_calls: [
          toolCall("c1", "update_element", { id: "hero-1", patch: { fontSize: "20px" } }),
        ],
      },
      { content: "That field does not exist." },
    ])

    const result = await runEditAgent(config, "bigger font", client)

    expect(result.changed).toBe(false)
    expect(result.config).toEqual(config)
    const secondCallMessages = create.mock.calls[1]![0].messages
    const toolMessage = secondCallMessages.at(-1)!
    expect(toolMessage).toMatchObject({ role: "tool", tool_call_id: "c1" })
    expect(String(toolMessage.content)).toContain("Error:")
  })

  it("handles malformed JSON arguments without crashing", async () => {
    const { client } = fakeOpenAI([
      {
        content: null,
        tool_calls: [
          { id: "c1", type: "function", function: { name: "update_element", arguments: "{not json" } },
        ],
      },
      { content: "Sorry, retried." },
    ])

    const result = await runEditAgent(config, "anything", client)

    expect(result.changed).toBe(false)
    expect(result.config).toEqual(config)
  })

  it("stops at the iteration cap and returns applied changes", async () => {
    const endless: FakeMessage[] = Array.from({ length: 10 }, (_, i) => ({
      content: null,
      tool_calls: [
        toolCall(`c${i}`, "update_element", { id: "text-1", patch: { text: `v${i}` } }),
      ],
    }))
    const { client, create } = fakeOpenAI(endless)

    const result = await runEditAgent(config, "loop forever", client)

    expect(create).toHaveBeenCalledTimes(6)
    expect(result.changed).toBe(true)
    expect(result.config[1]).toMatchObject({ text: "v5" })
    expect(result.summary).toBe("Applied the requested changes.")
  })

  it("returns changed: false when the model makes no tool calls", async () => {
    const { client } = fakeOpenAI([
      { content: "This page has no gallery to reorder." },
    ])

    const result = await runEditAgent(config, "reorder the gallery", client)

    expect(result.changed).toBe(false)
    expect(result.config).toEqual(config)
    expect(result.summary).toBe("This page has no gallery to reorder.")
  })
})
