import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ServicesElement, type ServicesElementConfig } from "./services-element"

describe("ServicesElement", () => {
  const config: ServicesElementConfig = {
    type: "services",
    title: "Our services",
    columns: 2,
    accentColor: "rgb(200, 80, 120)",
    items: [
      { name: "Haircut", price: "$40", description: "Wash, cut & style" },
      { name: "Manicure", price: "$25" },
    ],
  }

  it("renders the title and every service item", () => {
    render(<ServicesElement config={config} />)

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Our services")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(screen.getByText("Haircut")).toBeDefined()
    expect(screen.getByText("Wash, cut & style")).toBeDefined()
  })

  it("applies the accent color to prices", () => {
    render(<ServicesElement config={config} />)

    const price = screen.getByText("$40")
    expect(price.style.color).toBe("rgb(200, 80, 120)")
  })

  it("uses the configured column count", () => {
    render(<ServicesElement config={config} />)

    expect(screen.getByRole("list").className).toContain("sm:grid-cols-2")
  })
})
