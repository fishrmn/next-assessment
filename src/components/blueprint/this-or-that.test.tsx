import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { scaleField } from "@/lib/blueprint/registry"

import { ThisOrThat } from "./this-or-that"

// Vitest runs without globals here, so Testing Library cannot register its own cleanup.
afterEach(cleanup)

describe("ThisOrThat", () => {
  it("shows both examples with the brand's name", () => {
    render(<ThisOrThat field={scaleField("formality")} brand="Acme" value={null} onChange={() => {}} />)

    expect(screen.getByText(/Acme provides dependable solutions/)).toBeDefined()
    expect(screen.getByText(/Hey, we're Acme/)).toBeDefined()
  })

  it("records a lean, not an extreme, when a card is picked", () => {
    const onChange = vi.fn()
    render(<ThisOrThat field={scaleField("formality")} brand="Acme" value={null} onChange={onChange} />)

    fireEvent.click(screen.getByRole("button", { name: /Casual/ }))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it("marks the card on the chosen side as pressed", () => {
    render(<ThisOrThat field={scaleField("formality")} brand="Acme" value={1} onChange={() => {}} />)

    expect(screen.getByRole("button", { name: /Formal/ }).getAttribute("aria-pressed")).toBe("true")
    expect(screen.getByRole("button", { name: /Casual/ }).getAttribute("aria-pressed")).toBe("false")
  })
})
