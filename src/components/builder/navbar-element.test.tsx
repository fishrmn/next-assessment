import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { NavbarElement, type NavbarElementConfig } from "./navbar-element"

const base: NavbarElementConfig = {
  type: "navbar",
  brandName: "Maison Belle",
  links: [
    { label: "Services", href: "#services" },
    { label: "Contact", href: "#contact" },
  ],
  ctaLabel: "Book now",
  ctaHref: "#contact",
}

describe("NavbarElement", () => {
  it("shows the brand name as a text logo when no logo is set", () => {
    render(<NavbarElement config={base} />)

    expect(screen.getByText("Maison Belle")).toBeDefined()
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("shows the logo image instead of the name when logoUrl is set", () => {
    render(
      <NavbarElement
        config={{ ...base, logoUrl: "https://example.test/logo.png" }}
      />
    )

    const logo = screen.getByRole("img", { name: "Maison Belle" })
    expect(logo.getAttribute("src")).toBe("https://example.test/logo.png")
    expect(screen.queryByText("Maison Belle")).toBeNull()
  })

  it("renders menu links and the CTA", () => {
    render(<NavbarElement config={base} />)

    expect(screen.getByRole("link", { name: "Services" }).getAttribute("href")).toBe(
      "#services"
    )
    expect(screen.getByRole("link", { name: "Book now" })).toBeDefined()
  })

  it("applies background and text colors", () => {
    render(
      <NavbarElement
        config={{
          ...base,
          backgroundColor: "rgb(250, 247, 240)",
          textColor: "rgb(63, 53, 40)",
        }}
      />
    )

    const nav = screen.getByRole("navigation", { name: "Site" })
    expect(nav.style.backgroundColor).toBe("rgb(250, 247, 240)")
    expect(nav.style.color).toBe("rgb(63, 53, 40)")
  })
})
