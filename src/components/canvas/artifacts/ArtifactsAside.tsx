import type { BlueprintValues } from "@/lib/blueprint/field-config"

import { JumpToNav } from "./JumpToNav"
import { PalettePlate } from "./PalettePlate"
import { TypeSpecimen } from "./TypeSpecimen"
import { VoiceSample } from "./VoiceSample"

/**
 * The canvas's right-hand rail: live artifacts that re-derive from whatever the
 * user has typed so far. Everything below is a pure function of `values` — there
 * is no artifact state to keep in sync with the document.
 *
 * Width is the parent grid's concern; this component owns only the rule, the
 * gutter and the rhythm between blocks.
 *
 * The rule follows the axis the parent grid put us on: a left edge when we sit
 * beside the document (`lg` and up), a top edge when we stack beneath it, so it
 * never floats mid-page. `print:` restores the side rule because an A4 page is
 * narrower than `lg` — see the comment on the grid in `BlueprintCanvas`.
 *
 * Below `sm` the horizontal gutter comes from `.bp-shell` instead, which keeps
 * the rail's content on the same measure as the document's.
 */
export function ArtifactsAside({ values, title }: { values: BlueprintValues; title: string }) {
  const { brandExpression } = values

  return (
    <aside className="flex flex-col gap-[30px] border-t border-border py-9 sm:px-8 lg:border-t-0 lg:border-l print:border-t-0! print:border-l!">
      <JumpToNav values={values} />
      <PalettePlate colorDirection={brandExpression.colorDirection} />
      <TypeSpecimen typographyDirection={brandExpression.typographyDirection} />
      <VoiceSample
        title={title}
        personality={brandExpression.personality}
        toneOfVoice={brandExpression.toneOfVoice}
      />
    </aside>
  )
}
