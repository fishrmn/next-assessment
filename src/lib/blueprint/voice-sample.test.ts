import { describe, expect, it } from "vitest"

import { deriveVoiceSample } from "./voice-sample"

describe("deriveVoiceSample", () => {
  it("assembles the full quote with two or more traits", () => {
    const result = deriveVoiceSample({
      title: "Acme",
      personality: ["Bold", "Warm"],
      toneOfVoice: "Direct and warm",
    })

    expect(result).toBe("“Acme — bold and warm, Direct and warm.”")
  })

  it("caps traits at the first two even when more are provided", () => {
    const result = deriveVoiceSample({
      title: "Acme",
      personality: ["Bold", "Warm", "Playful"],
      toneOfVoice: "Direct and warm",
    })

    expect(result).toContain("bold and warm,")
    expect(result).not.toContain("playful")
  })

  it("omits the trait segment entirely when there are no traits", () => {
    const result = deriveVoiceSample({
      title: "Acme",
      personality: [],
      toneOfVoice: "Direct and warm",
    })

    expect(result).toBe("“Acme — Direct and warm.”")
    expect(result).not.toContain(", ,")
  })

  it("strips a trailing period from the tone before closing the quote", () => {
    const result = deriveVoiceSample({
      title: "Acme",
      personality: [],
      toneOfVoice: "Direct and warm.",
    })

    expect(result).toBe("“Acme — Direct and warm.”")
    expect(result).not.toContain("..”")
  })

  it("falls back to the placeholder sentence when tone of voice is empty or whitespace", () => {
    expect(
      deriveVoiceSample({ title: "Acme", personality: [], toneOfVoice: "" })
    ).toBe("Fill in tone of voice and a sample line will set here.")

    expect(
      deriveVoiceSample({ title: "Acme", personality: [], toneOfVoice: "   " })
    ).toBe("Fill in tone of voice and a sample line will set here.")
  })

  it("falls back to 'We' when the title is empty", () => {
    const result = deriveVoiceSample({
      title: "",
      personality: [],
      toneOfVoice: "Direct and warm",
    })

    expect(result).toBe("“We — Direct and warm.”")
  })
})
