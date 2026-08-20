import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { PageConfig } from "@/components/builder/types"

import { AiAssist } from "./ai-assist"

vi.mock("@/app/actions", () => ({
  aiEditPageAction: vi.fn(),
}))

const config: PageConfig = [
  { id: "hero-1", type: "hero", heading: "Welcome", align: "center" },
]

async function mockAction() {
  const { aiEditPageAction } = await import("@/app/actions")
  return vi.mocked(aiEditPageAction)
}

describe("AiAssist", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("disables Apply until a prompt is entered", () => {
    render(<AiAssist config={config} onReplace={() => {}} />)

    const button = screen.getByRole("button", { name: "Apply with AI" })
    expect(button).toHaveProperty("disabled", true)

    fireEvent.change(screen.getByLabelText("AI assist"), {
      target: { value: "make the hero darker" },
    })
    expect(button).toHaveProperty("disabled", false)
  })

  it("applies the returned config and shows the summary", async () => {
    const action = await mockAction()
    const next: PageConfig = [
      { id: "hero-1", type: "hero", heading: "Welcome", align: "center", backgroundColor: "#111827" },
    ]
    action.mockResolvedValue({
      ok: true,
      data: { config: next, summary: "Darkened the hero.", changed: true },
    })
    const onReplace = vi.fn()
    render(<AiAssist config={config} onReplace={onReplace} />)

    fireEvent.change(screen.getByLabelText("AI assist"), {
      target: { value: "make the hero darker" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Apply with AI" }))

    expect(await screen.findByRole("status")).toHaveProperty(
      "textContent",
      "Darkened the hero."
    )
    expect(action).toHaveBeenCalledWith("make the hero darker", config)
    expect(onReplace).toHaveBeenCalledWith(next)
  })

  it("does not replace the config when nothing changed", async () => {
    const action = await mockAction()
    action.mockResolvedValue({
      ok: true,
      data: { config, summary: "Nothing to change.", changed: false },
    })
    const onReplace = vi.fn()
    render(<AiAssist config={config} onReplace={onReplace} />)

    fireEvent.change(screen.getByLabelText("AI assist"), {
      target: { value: "remove the gallery" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Apply with AI" }))

    expect(await screen.findByRole("status")).toBeDefined()
    expect(onReplace).not.toHaveBeenCalled()
  })

  it("shows the action error", async () => {
    const action = await mockAction()
    action.mockResolvedValue({ ok: false, error: "AI edit failed." })
    const onReplace = vi.fn()
    render(<AiAssist config={config} onReplace={onReplace} />)

    fireEvent.change(screen.getByLabelText("AI assist"), {
      target: { value: "make it pop" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Apply with AI" }))

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "AI edit failed."
    )
    expect(onReplace).not.toHaveBeenCalled()
  })
})
