import { derivePalette } from "@/lib/blueprint/palette"

/**
 * Live palette read out of the user's colour-direction prose.
 *
 * The container wears the design system's `.plate` *mat* — a 6px surface border
 * with a hairline outline — but deliberately NOT `.plate`'s
 * `filter: sepia(...) saturate(...) contrast(...)`. That filter exists to mat
 * photographs; applied here it would colour-shift every chip so it no longer
 * matched the hex printed beside it, and the artifact would visibly lie about
 * the user's colours. Do not add a `filter` to this element.
 *
 * `bp-artifact`: the palette is part of the printed deliverable, so it must not
 * be split across a page break.
 */
export function PalettePlate({ colorDirection }: { colorDirection: string }) {
  const { swatches, note } = derivePalette(colorDirection)

  return (
    <section className="bp-artifact">
      <p className="mb-2.5 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Palette</p>

      <div
        className="p-[14px]"
        style={{
          border: "6px solid var(--surface)",
          outline: "1px solid var(--color-border)",
        }}
      >
        <div className="flex flex-col gap-2">
          {swatches.map((swatch) => (
            <div key={swatch.hex} className="flex items-center gap-2.5">
              {/*
                The hex is user-derived content, not a theme value — an inline
                background is the correct (and only) way to render it.
              */}
              <span
                aria-hidden="true"
                className="h-[26px] w-10 shrink-0 rounded-sm border border-neutral-300"
                style={{ background: swatch.hex }}
              />
              <span className="text-[13px] capitalize">{swatch.name}</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {swatch.hex}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">{note}</p>
      </div>
    </section>
  )
}
