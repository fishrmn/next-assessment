import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { GalleryElement, type GalleryElementConfig } from "./gallery-element"

describe("GalleryElement", () => {
  const config: GalleryElementConfig = {
    type: "gallery",
    title: "Our work",
    columns: 3,
    rounded: true,
    images: [
      { src: "https://example.com/a.jpg", alt: "Balayage" },
      { src: "https://example.com/b.jpg", alt: "Updo" },
    ],
  }

  it("renders the title and all images with alt text", () => {
    render(<GalleryElement config={config} />)

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Our work")
    const images = screen.getAllByRole("img")
    expect(images).toHaveLength(2)
    expect(screen.getByAltText("Balayage").getAttribute("src")).toBe("https://example.com/a.jpg")
  })

  it("applies rounded corners when configured", () => {
    render(<GalleryElement config={config} />)

    expect(screen.getByAltText("Updo").className).toContain("rounded-xl")
  })

  it("skips the title when not configured", () => {
    render(<GalleryElement config={{ ...config, title: undefined }} />)

    expect(screen.queryByRole("heading")).toBeNull()
  })
})
