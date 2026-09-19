import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { emptyBlueprint } from "@/lib/blueprint/model"
import { applyPatch } from "@/lib/blueprint/patch"

import { Changes } from "./changes"

// Vitest runs without globals here, so Testing Library cannot register its own cleanup.
afterEach(cleanup)

const { applied, rejected } = applyPatch(emptyBlueprint("Acme"), {
  expression: { tone: { humor: 4 }, typography: { pairing: "comic-sans" } },
})

describe("Changes", () => {
  it("folds the field-by-field list away, but never a refused value", async () => {
    render(<Changes output={{ applied, rejected }} undone={false} onUndo={() => {}} />)

    expect(screen.getByText("1 change")).toBeDefined()
    expect(screen.queryByText("Leans playful")).toBeNull()
    expect(screen.getByText(/was not set: must be one of: modern/)).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: /View details/ }))
    expect(await screen.findByText("Leans playful")).toBeDefined()
    expect(screen.getByText("Humor")).toBeDefined()
  })

  it("offers Undo for this session's changes only", () => {
    const onUndo = vi.fn()
    const { rerender } = render(<Changes output={{ applied, rejected: [] }} undone={false} onUndo={onUndo} />)
    fireEvent.click(screen.getByRole("button", { name: /Undo/ }))
    expect(onUndo).toHaveBeenCalledOnce()

    rerender(<Changes output={{ applied, rejected: [] }} undone={false} />)
    expect(screen.queryByRole("button", { name: /Undo/ })).toBeNull()

    rerender(<Changes output={{ applied, rejected: [] }} undone />)
    expect(screen.getByText(/Undone/)).toBeDefined()
  })

  it("draws nothing for a call that changed nothing", () => {
    const { container } = render(<Changes output={{ applied: [], rejected: [] }} undone={false} />)
    expect(container.innerHTML).toBe("")
  })
})
