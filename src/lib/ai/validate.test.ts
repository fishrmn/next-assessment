import { describe, expect, it } from "vitest"

import { validateElement, validatePatch } from "./validate"

describe("validatePatch", () => {
  it("accepts a valid partial patch", () => {
    expect(
      validatePatch("hero", { backgroundColor: "#111827", textColor: "#f9fafb" })
    ).toEqual({ ok: true })
  })

  it("accepts valid enum and array fields", () => {
    expect(validatePatch("text", { level: "h1" })).toEqual({ ok: true })
    expect(
      validatePatch("services", {
        columns: 3,
        items: [{ name: "Cut", price: "$40" }],
      })
    ).toEqual({ ok: true })
  })

  it("rejects unknown fields", () => {
    const result = validatePatch("hero", { fontSize: "20px" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('unknown field "fontSize"')
  })

  it("rejects bad enum values", () => {
    const result = validatePatch("text", { level: "h4" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('"level"')
  })

  it("rejects wrong primitive types", () => {
    expect(validatePatch("text", { text: 42 }).ok).toBe(false)
    expect(validatePatch("gallery", { rounded: "yes" }).ok).toBe(false)
  })

  it("rejects malformed array items", () => {
    const result = validatePatch("gallery", { images: [{ src: "/a.jpg" }] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("images[0].alt")
  })

  it("rejects changes to type and id", () => {
    expect(validatePatch("hero", { type: "text" }).ok).toBe(false)
    expect(validatePatch("hero", { id: "other" }).ok).toBe(false)
  })

  it("rejects non-object patches", () => {
    expect(validatePatch("hero", "darker").ok).toBe(false)
    expect(validatePatch("hero", null).ok).toBe(false)
  })
})

describe("validateElement", () => {
  it("accepts a complete valid element", () => {
    expect(
      validateElement({
        type: "cta",
        label: "Book now",
        href: "#contact",
        align: "center",
        size: "lg",
      })
    ).toEqual({ ok: true })
  })

  it("ignores a model-supplied id", () => {
    expect(
      validateElement({
        id: "made-up",
        type: "text",
        text: "Hello",
        level: "p",
        align: "left",
      })
    ).toEqual({ ok: true })
  })

  it("rejects unknown element types", () => {
    const result = validateElement({ type: "video", src: "/a.mp4" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('"type"')
  })

  it("rejects missing required fields", () => {
    const result = validateElement({ type: "cta", label: "Book", align: "left", size: "md" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('"href"')
  })

  it("rejects non-object values", () => {
    expect(validateElement(["not", "an", "element"]).ok).toBe(false)
  })
})
