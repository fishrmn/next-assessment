import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ContactElement, type ContactElementConfig } from "./contact-element"

describe("ContactElement", () => {
  const config: ContactElementConfig = {
    type: "contact",
    title: "Visit us",
    address: "123 Main St, Springfield",
    phone: "+1 555 0100",
    email: "hello@salon.test",
    align: "center",
    hours: [
      { days: "Mon–Fri", hours: "9am – 7pm" },
      { days: "Sat", hours: "10am – 4pm" },
    ],
  }

  it("renders address, phone, and email links", () => {
    render(<ContactElement config={config} />)

    expect(screen.getByText("123 Main St, Springfield")).toBeDefined()
    expect(screen.getByRole("link", { name: "+1 555 0100" }).getAttribute("href")).toBe(
      "tel:+1 555 0100"
    )
    expect(screen.getByRole("link", { name: "hello@salon.test" }).getAttribute("href")).toBe(
      "mailto:hello@salon.test"
    )
  })

  it("renders opening hours", () => {
    render(<ContactElement config={config} />)

    expect(screen.getByText("Mon–Fri")).toBeDefined()
    expect(screen.getByText("10am – 4pm")).toBeDefined()
  })

  it("omits email and hours when not configured", () => {
    render(
      <ContactElement
        config={{ ...config, email: undefined, hours: [] }}
      />
    )

    expect(screen.queryByRole("link", { name: /hello@/ })).toBeNull()
  })
})
