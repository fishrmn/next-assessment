"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, type ReactElement } from "react"
import { AiPromptRow } from "@/components/canvas/AiPromptRow"
import { CanvasHeader } from "@/components/canvas/CanvasHeader"
import { DocumentSection } from "@/components/canvas/DocumentSection"
import { ArtifactsAside } from "@/components/canvas/artifacts/ArtifactsAside"
import { useAutosave } from "@/hooks/use-autosave"
import { useBlueprintDraft } from "@/hooks/use-blueprint-draft"
import {
  ALL_FIELDS,
  DOCUMENT_SECTIONS,
  emptyBrandExpression,
  emptyBusinessContext,
  isFieldFilled,
  type BlueprintValues,
  type FieldConfig,
} from "@/lib/blueprint/field-config"
import { computeProgress } from "@/lib/blueprint/progress"
import type { AiEditResult } from "@/services/blueprint-ai.types"
import type { Blueprint, BrandExpression, BusinessContext } from "@/services/blueprint.types"

/**
 * The whole editing surface: one scrolling document, no steps and no terminal
 * "complete" screen. Every edit lands in the same draft and is persisted by a
 * single autosave instance — `useAutosave`'s `requestIdRef` orders responses
 * per instance only, so one in-flight save is what keeps the server-derived
 * `status` from being written back from a stale read.
 */
export function BlueprintCanvas({ blueprint }: { blueprint: Blueprint }): ReactElement {
  const router = useRouter()
  const { draft, updateBusinessContext, updateBrandExpression, updateClientName } =
    useBlueprintDraft(blueprint)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Both sections are nullable on `Blueprint` but required by `BlueprintValues`.
  // Defaulting to the module-level empties keeps these references stable while
  // the section is untouched, which is what makes the memos below hold.
  const businessContext = draft.businessContext ?? emptyBusinessContext
  const brandExpression = draft.brandExpression ?? emptyBrandExpression
  const values: BlueprintValues = useMemo(
    () => ({ businessContext, brandExpression }),
    [businessContext, brandExpression]
  )

  // The autosave effect keys on the patch identity, so a fresh object every
  // render would re-arm the debounce on every keystroke *and* every unrelated
  // re-render. Memoized on the three values it is built from.
  const patch = useMemo(
    () => ({ clientName: draft.clientName, businessContext, brandExpression }),
    [draft.clientName, businessContext, brandExpression]
  )
  const { status, flush } = useAutosave(draft.id, patch)

  const progress = computeProgress(values)
  const mode = ALL_FIELDS.some((field) => isFieldFilled(values, field)) ? "revise" : "generate"

  function handleFieldChange(field: FieldConfig, value: string | string[]) {
    // `field.section` picks the writer; the assertion covers only the pairing of
    // `field.key` with `value`, which a non-generic callback signature cannot
    // express. `field-config.ts` is the guarantee: the `chips` kinds are exactly
    // the `string[]` keys, and the field components send back the kind they render.
    const fieldPatch = { [field.key]: value }
    if (field.section === "businessContext") {
      updateBusinessContext(fieldPatch as Partial<BusinessContext>)
    } else {
      updateBrandExpression(fieldPatch as Partial<BrandExpression>)
    }
  }

  function handleAiApplied(result: AiEditResult) {
    updateBusinessContext(result.businessContext)
    updateBrandExpression(result.brandExpression)
  }

  async function handleDelete() {
    if (!window.confirm("Delete this Blueprint? This cannot be undone.")) return
    setDeleteError(null)
    // Settle any debounced write before the record goes away, so no PATCH is
    // left in flight against a deleted id.
    await flush()
    const res = await fetch(`/api/blueprints/${draft.id}`, { method: "DELETE" })
    if (!res.ok) {
      setDeleteError("Failed to delete this Blueprint. Please try again.")
      return
    }
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <CanvasHeader
        title={draft.clientName}
        onTitleChange={updateClientName}
        progress={progress}
        saveStatus={status}
        onExport={() => window.print()}
        onDelete={handleDelete}
        deleteError={deleteError}
        lookbookHref={`/blueprint/${draft.id}/lookbook`}
      />

      {/* Default `stretch` alignment, not `items-start`: the aside owns the
          column rule, which has to run the document's full height.

          Two columns from `lg` up, stacked below it. The `print:` overrides are
          not redundant with `lg:`: an A4 page at 18mm margins is ~658px wide, so
          the print viewport falls *below* `lg` and would otherwise export the
          single-column phone layout as the deliverable. The trailing `!` is what
          makes them win — `print` and `lg` are both media variants, so neither
          reliably outranks the other on source order alone (same reason the
          header's `print:hidden!` carries one). */}
      <div className="bp-shell grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_372px] print:grid-cols-[minmax(0,1fr)_372px]!">
        <div className="min-w-0 pt-10 pb-18 sm:px-8 lg:px-12 print:px-12!">
          <AiPromptRow blueprintId={draft.id} mode={mode} onApplied={handleAiApplied} />
          {DOCUMENT_SECTIONS.map((section) => (
            <DocumentSection
              key={section.num}
              section={section}
              values={values}
              onFieldChange={handleFieldChange}
            />
          ))}
        </div>

        <ArtifactsAside values={values} title={draft.clientName} />
      </div>
    </div>
  )
}
