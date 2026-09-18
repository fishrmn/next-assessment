import { PlateHeading } from "@/components/lookbook/PlateHeading"
import { derivePalette } from "@/lib/blueprint/palette"

/**
 * The palette with the room a lookbook owes it: large blocks, each with its
 * name and hex set on a hairline baseline beneath. This is the piece a client
 * actually takes away from the spread, so it leads.
 *
 * The frame is the design system's `.plate` *mat* — a 6px surface border with a
 * hairline divider outline — reproduced by hand rather than by wearing `.plate`
 * itself. `.plate` carries `filter: sepia(.22) saturate(.82) contrast(1.05)`,
 * which exists to mat photographs; applied here it would colour-shift every
 * block so it no longer matched the hex printed beside it, and the artifact
 * would visibly lie about the user's colours. Do not add a `filter` here.
 * (Same reasoning, same treatment as `canvas/artifacts/PalettePlate.tsx`.)
 *
 * `bp-artifact`: part of the printed deliverable — never split across a break.
 */
export function PaletteSpread({ colorDirection }: { colorDirection: string }) {
  const { swatches, note } = derivePalette(colorDirection)

  return (
    <section className="bp-artifact">
      <PlateHeading>Palette</PlateHeading>

      <div
        className="p-2 lg:p-3"
        style={{ border: "6px solid var(--surface)", outline: "1px solid var(--divider)" }}
      >
        <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
          {swatches.map((swatch) => (
            <li key={swatch.hex}>
              {/*
                The hex is user-derived content, not a theme value — an inline
                background is the correct (and only) way to render it.
              */}
              <span
                aria-hidden="true"
                className="block h-28 w-full rounded-sm border border-neutral-300 lg:h-44"
                style={{ background: swatch.hex }}
              />
              <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-border pt-2">
                <span className="font-heading text-lg capitalize lg:text-xl">{swatch.name}</span>
                <span className="text-xs text-muted-foreground uppercase tabular-nums">
                  {swatch.hex}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-3 mb-0 px-1 text-xs text-muted-foreground lg:mt-4">{note}</p>
      </div>
    </section>
  )
}
