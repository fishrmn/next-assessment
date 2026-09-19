import { useState } from "react"
import { emptyBrandExpression, emptyBusinessContext } from "@/lib/blueprint/field-config"
import type { Blueprint, BusinessContext, BrandExpression } from "@/services/blueprint.types"

export function useBlueprintDraft(initial: Blueprint) {
  const [draft, setDraft] = useState(initial)

  // The `{ ...empty, ...prev, ...patch }` order matters: merging a partial
  // patch onto a null section without the defaults used to yield
  // `competitors: undefined` on the first keystroke and crash a `.map()`
  // downstream.
  function updateBusinessContext(patch: Partial<BusinessContext>) {
    setDraft((prev) => ({
      ...prev,
      businessContext: { ...emptyBusinessContext, ...prev.businessContext, ...patch },
    }))
  }

  function updateBrandExpression(patch: Partial<BrandExpression>) {
    setDraft((prev) => ({
      ...prev,
      brandExpression: { ...emptyBrandExpression, ...prev.brandExpression, ...patch },
    }))
  }

  function updateClientName(name: string) {
    setDraft((prev) => ({ ...prev, clientName: name }))
  }

  return { draft, updateBusinessContext, updateBrandExpression, updateClientName }
}
