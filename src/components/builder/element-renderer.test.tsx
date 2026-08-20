import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ElementRenderer, PageRenderer } from "./element-renderer"
import type { ElementConfig, PageConfig } from "./types"

describe("ElementRenderer", () => {
  it.each<[string, ElementConfig, string]>([
    ["text", { type: "text", text: "Hello", level: "h2", align: "left" }, "Hello"],
    ["hero", { type: "hero", heading: "Hero heading", align: "center" }, "Hero heading"],
    [
      "services",
      { type: "services", title: "Services", columns: 2, items: [] },
      "Services",
    ],
    ["gallery", { type: "gallery", title: "Gallery", columns: 3, images: [] }, "Gallery"],
    ["cta", { type: "cta", label: "Click me", href: "#", align: "left", size: "md" }, "Click me"],
    [
      "contact",
      { type: "contact", title: "Contact", address: "A", phone: "1", hours: [], align: "left" },
      "Contact",
    ],
  ])("renders a %s element", (_, config, expectedText) => {
    render(<ElementRenderer config={config} />)

    expect(screen.getByText(expectedText)).toBeDefined()
  })
})

describe("PageRenderer", () => {
  it("renders all elements in order", () => {
    const config: PageConfig = [
      { id: "a", type: "hero", heading: "First", align: "center" },
      { id: "b", type: "text", text: "Second", level: "p", align: "left" },
      { id: "c", type: "cta", label: "Third", href: "#", align: "center", size: "md" },
    ]

    render(<PageRenderer config={config} />)

    const texts = [
      screen.getByText("First"),
      screen.getByText("Second"),
      screen.getByText("Third"),
    ]
    for (let i = 1; i < texts.length; i++) {
      expect(texts[i - 1].compareDocumentPosition(texts[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })
})
