import { describe, expect, it } from "vitest"

import { sanitizeList, sanitizeText } from "./sanitize"

describe("sanitizeText", () => {
  it("trims leading and trailing whitespace", () => {
    expect(sanitizeText("  hello world  ")).toBe("hello world")
  })

  it("strips control characters", () => {
    expect(sanitizeText("hello\x00wor\x1Bld")).toBe("helloworld")
  })

  it("caps length at the default max", () => {
    const value = "a".repeat(2100)
    expect(sanitizeText(value)).toHaveLength(2000)
  })

  it("caps length at a custom maxLength", () => {
    expect(sanitizeText("abcdefghij", 5)).toBe("abcde")
  })
})

describe("sanitizeList", () => {
  it("caps the number of items at the default max", () => {
    const values = Array.from({ length: 25 }, (_, i) => `item${i}`)
    expect(sanitizeList(values)).toHaveLength(20)
  })

  it("caps the number of items at a custom max", () => {
    const values = ["a", "b", "c", "d"]
    expect(sanitizeList(values, 2)).toEqual(["a", "b"])
  })

  it("caps each item's length at the default max", () => {
    const value = "x".repeat(250)
    expect(sanitizeList([value])[0]).toHaveLength(200)
  })

  it("caps each item's length at a custom max", () => {
    expect(sanitizeList(["abcdefghij"], 20, 4)).toEqual(["abcd"])
  })

  it("filters out entries that become empty after sanitizing", () => {
    expect(sanitizeList(["  ", "keep", "\x00\x01", ""])).toEqual(["keep"])
  })
})
