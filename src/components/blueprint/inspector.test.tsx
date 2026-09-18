import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { editSlot } from "@/lib/blueprint/document-sections"
import { normalizeBlueprint } from "@/lib/blueprint/model"

import { Inspector } from "./inspector"

// Vitest runs without globals here, so Testing Library cannot register its own cleanup.
afterEach(cleanup)

const blueprint = normalizeBlueprint({ business: { name: "Acme", differentiator: "skip the sales call" } })

describe("Inspector", () => {
  it("asks the person to pick a section when none is selected", () => {
    render(<Inspector blueprint={blueprint} selected={null} onChange={() => {}} onDone={() => {}} />)

    expect(screen.getByText("Click a section of the blueprint")).toBeDefined()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("shows the selected section's text and reports an edit", () => {
    const onChange = vi.fn()
    render(<Inspector blueprint={blueprint} selected="apart" onChange={onChange} onDone={() => {}} />)

    const title = screen.getByLabelText("Title") as HTMLInputElement
    expect(title.value).toBe("What sets them apart")
    expect((screen.getByLabelText("Description") as HTMLTextAreaElement).value).toBe("We skip the sales call.")

    fireEvent.change(title, { target: { value: "Why us" } })
    expect(onChange).toHaveBeenCalledWith(editSlot(blueprint, "apart", "title", "Why us"))
  })

  it("offers Reset only for an edited field, and Reset removes the edit", () => {
    const onChange = vi.fn()
    const edited = editSlot(blueprint, "apart", "title", "Why us")
    const { rerender } = render(
      <Inspector blueprint={blueprint} selected="apart" onChange={onChange} onDone={() => {}} />
    )
    expect(screen.queryByRole("button", { name: /Reset/ })).toBeNull()

    rerender(<Inspector blueprint={edited} selected="apart" onChange={onChange} onDone={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /Reset/ }))
    expect(onChange).toHaveBeenCalledWith(blueprint)
  })
})
