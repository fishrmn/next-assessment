import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { Blueprint } from "@/services/blueprint.types"
import { useBlueprintDraft } from "./use-blueprint-draft"

const baseBlueprint: Blueprint = {
  id: 1,
  clientName: "Acme Co",
  status: "draft",
  currentStep: 1,
  businessContext: null,
  brandExpression: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("useBlueprintDraft", () => {
  it("merges a businessContext patch onto full defaults when starting from null", () => {
    const { result } = renderHook(() => useBlueprintDraft(baseBlueprint))

    act(() => {
      result.current.updateBusinessContext({ industry: "x" })
    })

    expect(result.current.draft.businessContext).toEqual({
      industry: "x",
      audience: "",
      competitors: [],
      differentiators: "",
    })
  })

  it("merges a brandExpression patch onto full defaults when starting from null", () => {
    const { result } = renderHook(() => useBlueprintDraft(baseBlueprint))

    act(() => {
      result.current.updateBrandExpression({ visualStyle: "minimal" })
    })

    expect(result.current.draft.brandExpression).toEqual({
      visualStyle: "minimal",
      colorDirection: "",
      typographyDirection: "",
      toneOfVoice: "",
      personality: [],
    })
  })

  it("merges successive businessContext patches without losing earlier fields", () => {
    const { result } = renderHook(() => useBlueprintDraft(baseBlueprint))

    act(() => {
      result.current.updateBusinessContext({ industry: "x" })
    })
    act(() => {
      result.current.updateBusinessContext({ audience: "y" })
    })

    expect(result.current.draft.businessContext).toMatchObject({
      industry: "x",
      audience: "y",
    })
  })

  it("leaves competitors an array after a first partial patch", () => {
    const { result } = renderHook(() => useBlueprintDraft(baseBlueprint))

    act(() => {
      result.current.updateBusinessContext({ industry: "x" })
    })

    expect(Array.isArray(result.current.draft.businessContext?.competitors)).toBe(true)
    expect(Array.isArray(result.current.draft.brandExpression?.personality ?? [])).toBe(true)
  })

  it("updates the client name without touching the sections", () => {
    const { result } = renderHook(() => useBlueprintDraft(baseBlueprint))

    act(() => {
      result.current.updateClientName("Globex")
    })

    expect(result.current.draft.clientName).toBe("Globex")
    expect(result.current.draft.businessContext).toBeNull()
    expect(result.current.draft.brandExpression).toBeNull()
  })

  it("does not affect brandExpression when updating businessContext", () => {
    const { result } = renderHook(() => useBlueprintDraft(baseBlueprint))

    act(() => {
      result.current.updateBusinessContext({ industry: "x" })
    })

    expect(result.current.draft.brandExpression).toBeNull()
  })
})
