import { describe, expect, it } from "vitest"

import { defaultMode } from "./mode"

describe("defaultMode", () => {
  it("follows the moment", () => {
    // Nothing to show yet: talk.
    expect(defaultMode("start", false)).toBe("agent")
    // A proposal to judge: the agent sits next to it.
    expect(defaultMode("proposal", false)).toBe("side")
    // The person confirmed it: the document has the screen.
    expect(defaultMode("proposal", true)).toBe("document")
  })
})
