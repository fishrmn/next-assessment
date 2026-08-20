import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CtaElement, type CtaElementConfig } from "./cta-element"

describe("CtaElement", () => {
  const config: CtaElementConfig = {
    type: "cta",
    label: "Book an appointment",
    href: "/contact",
    align: "center",
    size: "lg",
    backgroundColor: "rgb(30, 30, 30)",
    textColor: "rgb(255, 250, 240)",
  }

  it("renders a link with the configured label and href", () => {
    render(<CtaElement config={config} />)

    const link = screen.getByRole("link", { name: "Book an appointment" })
    expect(link.getAttribute("href")).toBe("/contact")
  })

  it("applies colors and size", () => {
    render(<CtaElement config={config} />)

    const link = screen.getByRole("link")
    expect(link.style.backgroundColor).toBe("rgb(30, 30, 30)")
    expect(link.style.color).toBe("rgb(255, 250, 240)")
    expect(link.className).toContain("text-lg")
  })
})
