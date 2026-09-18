import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Fragment } from "react"

import { PaletteSpread } from "@/components/lookbook/PaletteSpread"
import { PlateHeading } from "@/components/lookbook/PlateHeading"
import { buttonVariants } from "@/components/ui/button"
import {
  DOCUMENT_SECTIONS,
  emptyBrandExpression,
  emptyBusinessContext,
  getFieldValue,
  isFieldFilled,
  type BlueprintValues,
  type SectionConfig,
} from "@/lib/blueprint/field-config"
import { deriveTypeSpecimen } from "@/lib/blueprint/type-specimen"
import { deriveVoiceSample } from "@/lib/blueprint/voice-sample"
import { cn } from "@/lib/utils"
import type { Blueprint } from "@/services/blueprint.types"

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

/**
 * The read-only spread: the Blueprint as the artifact you send someone, not the
 * editor with its inputs disabled. Different composition, different order — the
 * derived expression (palette, type, voice) leads, the written brief follows.
 *
 * A half-filled Blueprint is the normal case here, because the app saves
 * partials. Every block degrades on its own: empty fields drop out of their
 * section, a section with nothing in it sets a quiet em-dash, and the voice
 * quote is omitted entirely rather than printing `deriveVoiceSample`'s
 * editor-facing "fill in tone of voice" prompt to a client.
 */
export function Lookbook({ blueprint }: { blueprint: Blueprint }) {
  // Both sections are nullable on `Blueprint` but required by `BlueprintValues`.
  const values: BlueprintValues = {
    businessContext: blueprint.businessContext ?? emptyBusinessContext,
    brandExpression: blueprint.brandExpression ?? emptyBrandExpression,
  }
  const { industry, audience } = values.businessContext
  const { colorDirection, typographyDirection, toneOfVoice, personality } = values.brandExpression

  const title = blueprint.clientName.trim() || "Untitled brand"
  const standfirst = audience.trim()
  const kicker = industry.trim()

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print border-b border-border">
        <div className="mx-auto w-full max-w-[880px] px-5 py-3 lg:px-10">
          <Link
            href={`/blueprint/${blueprint.id}`}
            className={cn(buttonVariants({ variant: "ghost" }), "-ml-2.5 gap-1.5")}
          >
            <ArrowLeft aria-hidden="true" />
            Back to editing
          </Link>
        </div>
      </div>

      <article className="mx-auto w-full max-w-[880px] px-5 pt-12 pb-20 lg:px-10 lg:pt-20 lg:pb-28">
        <header className="bp-section border-b border-border pb-10 lg:pb-16">
          <div className="flex items-center gap-4">
            <p className="eyebrow m-0">Blueprint</p>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            <p className="m-0 text-xs text-muted-foreground tabular-nums">
              No. {String(blueprint.id).padStart(4, "0")}
            </p>
          </div>

          <h1 className="mt-8 mb-0 font-heading text-[clamp(2.75rem,13vw,6.5rem)] leading-[0.95] font-medium tracking-[-0.01em] break-words lg:mt-14">
            {title}
          </h1>

          {kicker && (
            <p className="mt-6 mb-0 text-xs font-medium tracking-[0.18em] text-accent-700 uppercase lg:mt-8">
              {kicker}
            </p>
          )}
          {standfirst && (
            <p className="mt-3 mb-0 max-w-[46ch] text-lg leading-[1.6] break-words text-muted-foreground lg:text-xl">
              {standfirst}
            </p>
          )}
        </header>

        <div className="mt-14 grid gap-14 lg:mt-20 lg:gap-20">
          <PaletteSpread colorDirection={colorDirection} />
          <TypePlate typographyDirection={typographyDirection} />
          {toneOfVoice.trim() && (
            <VoicePlate quote={deriveVoiceSample({ title, personality, toneOfVoice })} />
          )}
        </div>

        <div className="mt-16 border-t border-border pt-14 lg:mt-24 lg:pt-20">
          {DOCUMENT_SECTIONS.map((section) => (
            <SectionSpread key={section.num} section={section} values={values} />
          ))}
        </div>

        <footer className="bp-section mt-16 border-t border-border pt-5 lg:mt-24">
          <p className="m-0 text-xs text-muted-foreground tabular-nums">
            Last updated {DATE_FORMAT.format(blueprint.updatedAt)}
          </p>
        </footer>
      </article>
    </div>
  )
}

/**
 * The derived stack set at display scale — the specimen has to be *set*, not
 * described, so the font family is inline for the same reason a swatch's
 * background is: it is derived from what the user wrote, not a theme value.
 */
function TypePlate({ typographyDirection }: { typographyDirection: string }) {
  const { label, stack } = deriveTypeSpecimen(typographyDirection)

  return (
    <section className="bp-artifact">
      <PlateHeading>Type specimen</PlateHeading>

      <p
        className="m-0 text-[clamp(4rem,20vw,10rem)] leading-[0.9]"
        style={{ fontFamily: stack }}
      >
        Aa Bb
      </p>
      <p
        className="mt-6 mb-0 text-lg leading-[1.5] lg:mt-8 lg:text-2xl"
        style={{ fontFamily: stack }}
      >
        The quick brown fox jumps over the lazy dog, 0123456789.
      </p>
      <p className="mt-5 mb-0 text-xs text-muted-foreground">{label}</p>
    </section>
  )
}

/** `deriveVoiceSample` already returns the line inside typographic quotes. */
function VoicePlate({ quote }: { quote: string }) {
  return (
    <section className="bp-artifact">
      <PlateHeading>Voice</PlateHeading>

      <blockquote className="m-0 border-l-2 border-accent-300 pl-5 lg:pl-8">
        <p className="m-0 font-heading text-[clamp(1.6rem,6vw,3rem)] leading-[1.35] italic">
          {quote}
        </p>
      </blockquote>
    </section>
  )
}

/**
 * One section of the written brief, typeset. Empty fields are dropped rather
 * than printed as a label with nothing under it; a section with no filled field
 * keeps its heading — it is part of the document's skeleton — and sets an
 * em-dash, which reads as "intentionally blank" in print and is announced
 * properly to a screen reader.
 */
function SectionSpread({ section, values }: { section: SectionConfig; values: BlueprintValues }) {
  const filled = section.fields.filter((field) => isFieldFilled(values, field))

  return (
    <section className="bp-section mb-14 last:mb-0 lg:mb-20">
      <div className="mb-7 flex items-baseline gap-4 lg:mb-10">
        <span className="text-xs tracking-[0.2em] text-accent-700 tabular-nums">{section.num}</span>
        <h2 className="m-0 font-heading text-[26px] font-medium lg:text-[34px]">{section.title}</h2>
        <span aria-hidden="true" className="h-px flex-1 self-center bg-border" />
      </div>

      {filled.length === 0 ? (
        <p className="m-0 text-muted-foreground">
          <span aria-hidden="true">—</span>
          <span className="sr-only">Nothing filled in yet</span>
        </p>
      ) : (
        <dl className="m-0 grid grid-cols-1 gap-y-7 lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-9">
          {filled.map((field) => (
            <Fragment key={`${field.section}.${field.key}`}>
              <dt className="eyebrow lg:pt-2">{field.label}</dt>
              <dd className="m-0">
                <FieldValue value={getFieldValue(values, field)} />
              </dd>
            </Fragment>
          ))}
        </dl>
      )}
    </section>
  )
}

/**
 * `getFieldValue` is `string | string[]`; the array case is the chip fields and
 * is narrowed, never cast. `whitespace-pre-line` keeps the paragraph breaks the
 * user typed into the textarea fields.
 */
function FieldValue({ value }: { value: string | string[] }) {
  if (Array.isArray(value)) {
    return (
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {value.map((item, index) => (
          <li key={`${index}-${item}`} className="tag-accent">
            {item}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <p className="m-0 text-[17px] leading-[1.7] break-words whitespace-pre-line lg:text-lg">
      {value}
    </p>
  )
}
