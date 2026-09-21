import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { BlueprintMessage } from "@/agents/blueprint"
import { emptyBlueprint } from "@/lib/blueprint/model"
import { applyPatch } from "@/lib/blueprint/patch"

import { BlueprintChatProvider, useBlueprintChat } from "./context"

// The real actions open the SQLite file. Only the provider's own logic is tested here.
vi.mock("@/actions/blueprints", () => ({ saveUndone: vi.fn() }))

afterEach(cleanup)

const { applied } = applyPatch(emptyBlueprint("Acme"), { expression: { tone: { humor: 4 } } })
const history = [
  { id: "u1", role: "user", parts: [{ type: "text", text: "more playful" }] },
  {
    id: "a1",
    role: "assistant",
    parts: [
      {
        type: "tool-updateBlueprint",
        toolCallId: "call_1",
        state: "output-available",
        input: {},
        output: { applied, rejected: [] },
      },
    ],
  },
] as unknown as BlueprintMessage[]

function Probe() {
  const { undone, canUndo, updates } = useBlueprintChat()
  return (
    <p>
      undone:{String(undone.has("call_1"))} canUndo:{String(canUndo("call_1"))} updates:{updates}
    </p>
  )
}

describe("BlueprintChatProvider with restored history", () => {
  it("still knows what was undone in an earlier visit", () => {
    render(
      <BlueprintChatProvider
        id={1}
        blueprint={emptyBlueprint("Acme")}
        onBlueprintChange={() => {}}
        initialMessages={history}
        initialUndone={["call_1"]}
      >
        <Probe />
      </BlueprintChatProvider>
    )
    expect(screen.getByText(/undone:true/)).toBeDefined()
  })

  it("does not re-apply or offer Undo for changes the stored Blueprint already contains", () => {
    const onBlueprintChange = vi.fn()
    render(
      <BlueprintChatProvider
        id={1}
        blueprint={emptyBlueprint("Acme")}
        onBlueprintChange={onBlueprintChange}
        initialMessages={history}
      >
        <Probe />
      </BlueprintChatProvider>
    )
    expect(screen.getByText(/undone:false canUndo:false updates:1/)).toBeDefined()
    expect(onBlueprintChange).not.toHaveBeenCalled()
  })
})
