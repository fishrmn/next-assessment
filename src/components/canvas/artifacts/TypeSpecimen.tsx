import { deriveTypeSpecimen } from "@/lib/blueprint/type-specimen"

/**
 * Live type specimen: the derived font stack set in its own letterforms, so the
 * user sees their typography direction rather than reading it back.
 *
 * `bp-artifact`: part of the printed deliverable — never split across a break.
 */
export function TypeSpecimen({ typographyDirection }: { typographyDirection: string }) {
  const { label, stack } = deriveTypeSpecimen(typographyDirection)

  return (
    <section className="bp-artifact">
      <p className="mb-2.5 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        Type specimen
      </p>

      <div className="rounded-md border border-neutral-300 p-4">
        {/* The derived stack is the artifact — it has to be set, not described. */}
        <p className="m-0 text-[44px] leading-none" style={{ fontFamily: stack }}>
          Aa Bb
        </p>
        <p className="mt-3 mb-0 text-[13px] leading-[1.55]" style={{ fontFamily: stack }}>
          The quick brown fox jumps over the lazy dog, 0123456789.
        </p>
        <p className="mt-3 mb-0 text-xs text-muted-foreground">{label}</p>
      </div>
    </section>
  )
}
