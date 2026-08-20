import { describe, expect, it } from "vitest"

import type { PageConfig } from "@/components/builder/types"

import { defaultElementConfig } from "./element-meta"
import { editorReducer, normalizeConfig } from "./editor-reducer"

const config: PageConfig = [
  { id: "a", type: "text", text: "First", level: "p", align: "left" },
  { id: "b", type: "hero", heading: "Second", align: "center" },
  { id: "c", type: "cta", label: "Third", href: "#", align: "left", size: "md" },
]

describe("normalizeConfig", () => {
  it("assigns ids to elements that lack one and keeps existing ids", () => {
    const result = normalizeConfig([
      { type: "text", text: "No id", level: "p", align: "left" },
      { id: "keep", type: "text", text: "Has id", level: "p", align: "left" },
    ])

    expect(result[0].id).toBeTruthy()
    expect(result[1].id).toBe("keep")
  })
})

describe("editorReducer", () => {
  it("patches only the targeted element", () => {
    const result = editorReducer(config, {
      type: "update",
      id: "a",
      patch: { text: "Changed" },
    })

    expect(result[0]).toMatchObject({ id: "a", text: "Changed" })
    expect(result[1]).toBe(config[1])
  })

  it("moves elements up and down within bounds", () => {
    const down = editorReducer(config, { type: "move", id: "a", direction: "down" })
    expect(down.map((e) => e.id)).toEqual(["b", "a", "c"])

    const clampedTop = editorReducer(config, { type: "move", id: "a", direction: "up" })
    expect(clampedTop).toBe(config)

    const clampedBottom = editorReducer(config, { type: "move", id: "c", direction: "down" })
    expect(clampedBottom).toBe(config)
  })

  it("removes an element by id", () => {
    const result = editorReducer(config, { type: "remove", id: "b" })

    expect(result.map((e) => e.id)).toEqual(["a", "c"])
  })

  it("appends new elements", () => {
    const element = defaultElementConfig("services")
    const result = editorReducer(config, { type: "add", element })

    expect(result).toHaveLength(4)
    expect(result[3]).toMatchObject({ type: "services" })
    expect(result[3].id).toBeTruthy()
  })

  it("replaces the whole config", () => {
    const next: PageConfig = [
      { id: "x", type: "text", text: "Only", level: "h1", align: "center" },
    ]
    const result = editorReducer(config, { type: "replace", config: next })

    expect(result).toBe(next)
  })
})
