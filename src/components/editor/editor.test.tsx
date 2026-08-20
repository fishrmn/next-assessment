import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Page } from "@/db/types"

import { Editor } from "./editor"

vi.mock("@/app/actions", () => ({
  savePageAction: vi.fn(async (id: string, input: { name?: string }) => ({
    ok: true,
    data: { id, ...input },
  })),
}))

const page: Page = {
  id: "11111111-1111-4111-8111-111111111111",
  user_id: "u",
  name: "Test page",
  template: "elegance",
  config: [
    { id: "hero-1", type: "hero", heading: "Original heading", align: "center" },
  ],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("Editor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates the live preview as the user edits a field", () => {
    render(<Editor initialPage={page} />)

    fireEvent.click(screen.getByRole("button", { name: /Original heading/ }))
    fireEvent.change(screen.getByLabelText("Heading"), {
      target: { value: "Fresh heading" },
    })

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Fresh heading"
    )
  })

  it("shows the unsaved badge after an edit and clears it after saving", async () => {
    render(<Editor initialPage={page} />)

    expect(screen.queryByText("Unsaved changes")).toBeNull()

    fireEvent.change(screen.getByLabelText("Page name"), {
      target: { value: "Renamed" },
    })
    expect(screen.getByText("Unsaved changes")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByRole("button", { name: "Save" })).toBeDefined()
    expect(screen.queryByText("Unsaved changes")).toBeNull()

    const { savePageAction } = await import("@/app/actions")
    expect(savePageAction).toHaveBeenCalledWith(page.id, {
      name: "Renamed",
      config: page.config,
    })
  })

  it("adds a new element from the inspector", () => {
    render(<Editor initialPage={page} />)

    fireEvent.click(screen.getByRole("button", { name: "Button" }))

    expect(screen.getByRole("link", { name: "Call to action" })).toBeDefined()
  })

  it("enters and exits full-screen view", () => {
    render(<Editor initialPage={page} />)

    // Desktop toggle and mobile button share the label; jsdom shows both.
    fireEvent.click(screen.getAllByRole("button", { name: "Full-screen view" })[0])
    expect(screen.getByRole("button", { name: /Exit full screen/ })).toBeDefined()

    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByRole("button", { name: /Exit full screen/ })).toBeNull()
  })
})
