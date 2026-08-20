import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PageRenderer } from "@/components/builder/element-renderer"

import { getTemplate, templateList } from "./templates"

describe("templates", () => {
  it("provides three distinct templates", () => {
    expect(templateList).toHaveLength(3)
    expect(new Set(templateList.map((t) => t.id)).size).toBe(3)
  })

  it.each(templateList.map((t) => [t.id, t] as const))(
    "renders the %s template through PageRenderer",
    (_, template) => {
      render(<PageRenderer config={template.config} />)

      const hero = template.config.find((el) => el.type === "hero")
      expect(hero).toBeDefined()
      expect(
        screen.getByRole("heading", { level: 1, name: hero!.heading })
      ).toBeDefined()
    }
  )

  it("looks up templates by id and rejects unknown ids", () => {
    expect(getTemplate("elegance")?.name).toBe("Elegance")
    expect(getTemplate("nope")).toBeNull()
  })
})
