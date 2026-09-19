import { slotText } from "@/lib/blueprint/document-sections"
import type { Blueprint, ScaleValue, SectionId } from "@/lib/blueprint/model"
import {
  SCALES,
  describeScale,
  fontInfo,
  readScale,
  readableOn,
  type ScaleField,
} from "@/lib/blueprint/registry"
import { cn } from "@/lib/utils"

/** Shown until the client picks a palette: a neutral page that says "no color yet". */
const NEUTRAL = {
  primary: "#27272a",
  secondary: "#52525b",
  accent: "#a1a1aa",
  background: "#ffffff",
}

/**
 * The Brand Blueprint one-pager.
 *
 * A pure render of the model: same Blueprint in, same page out. It has no state
 * and no data fetching, so the workspace can re-render it on every keystroke
 * (the live preview) and the presentation route can render it on the server.
 *
 * The page wears the client's brand: their palette and font pairing arrive as
 * CSS variables on the root element. These are the only raw color values in the
 * app, and they are data, not styling decisions. The document therefore looks
 * the same in the app's light and dark themes, like a PDF would.
 *
 * It lays itself out by its container (`@container`), never by the window,
 * because it lives in a half-width panel and in a full-width presentation.
 *
 * Every title and sentence is read through `slotText`, which returns the reworded
 * text when the agent stored one (`blueprint.copy`) and the generated text otherwise.
 */
export function BlueprintDocument({
  blueprint,
  className,
}: {
  blueprint: Blueprint
  className?: string
}) {
  const { business, expression } = blueprint
  const palette = expression.color.palette ?? NEUTRAL
  const font = fontInfo(expression.typography.pairing)
  const ink = readableOn(palette.background)

  const style = {
    "--bp-primary": palette.primary,
    "--bp-on-primary": readableOn(palette.primary),
    "--bp-secondary": palette.secondary,
    "--bp-accent": palette.accent,
    "--bp-bg": palette.background,
    "--bp-ink": ink,
    "--bp-heading": font?.heading ?? "var(--font-sans)",
    "--bp-body": font?.body ?? "var(--font-sans)",
  } as React.CSSProperties

  const text = (id: SectionId, key: "title" | "body") => slotText(blueprint, id, key)
  const lead = text("hero", "body")
  const sample = text("voice", "body")
  const typographyNote = text("typography", "body")
  const colorNote = text("color", "body")
  const toneScales = SCALES.filter((field) => field.group === "tone")
  const visualScales = SCALES.filter((field) => field.group === "visual")

  return (
    <article
      style={style}
      className={cn(
        "@container overflow-hidden rounded-xl bg-(--bp-bg) font-(family-name:--bp-body) text-(--bp-ink) shadow-[0_0_0_1px_oklch(0_0_0/0.08),0_1px_2px_oklch(0_0_0/0.06),0_8px_24px_-8px_oklch(0_0_0/0.12)] transition-[background-color,color] duration-300",
        className
      )}
    >
      <header
        className="flex flex-col gap-4 bg-(--bp-primary) p-6 text-(--bp-on-primary) transition-[background-color,color] duration-300 @2xl:p-10"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium tracking-widest uppercase opacity-80">
          <span className="max-w-full wrap-anywhere">{text("hero", "title")}</span>
          {business.industry && (
            <>
              <span aria-hidden>·</span>
              <span>{business.industry}</span>
            </>
          )}
        </div>
        <h2 className="max-w-full font-(family-name:--bp-heading) text-4xl leading-none font-semibold tracking-tight text-balance wrap-anywhere @2xl:text-6xl">
          {business.name || "Untitled brand"}
        </h2>
        {lead ? (
          <p className="max-w-[60ch] text-lg leading-snug text-pretty wrap-anywhere opacity-90 @2xl:text-xl">
            {lead}
          </p>
        ) : (
          <p className="text-lg opacity-60">What they do, and for whom.</p>
        )}
      </header>

      <div className="grid gap-x-10 gap-y-8 p-6 @2xl:grid-cols-2 @2xl:p-10">
        <Block id="apart" blueprint={blueprint}>
          <Answer value={text("apart", "body")} />
        </Block>
        <Block id="headed" blueprint={blueprint}>
          <Answer value={text("headed", "body")} />
        </Block>
        <Block id="against" blueprint={blueprint}>
          {business.comparables.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {business.comparables.map((name) => (
                <li
                  key={name}
                  className="max-w-full rounded-full border border-current/20 px-3 py-1 text-sm wrap-anywhere"
                >
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <Pending />
          )}
        </Block>
        <Block id="personality" blueprint={blueprint}>
          {expression.personality.length > 0 ? (
            <p className="font-(family-name:--bp-heading) text-2xl leading-tight font-semibold text-(--bp-primary) @2xl:text-3xl">
              {expression.personality.join(" · ")}
            </p>
          ) : (
            <Pending />
          )}
        </Block>

        <Block id="voice" blueprint={blueprint} className="@2xl:col-span-2">
          <div className="grid gap-6 @2xl:grid-cols-2 @2xl:gap-10">
            <ul className="flex flex-col gap-3">
              {toneScales.map((field) => (
                <ScaleRow key={field.id} field={field} value={readScale(blueprint, field.id)} />
              ))}
            </ul>
            <figure className="flex flex-col justify-center gap-2 rounded-lg border-l-4 border-(--bp-accent) bg-current/5 p-5">
              <figcaption className="text-xs font-medium tracking-widest uppercase opacity-60">
                Sounds like
              </figcaption>
              {sample ? (
                <blockquote className="font-(family-name:--bp-heading) text-xl leading-snug text-pretty wrap-anywhere">
                  “{sample}”
                </blockquote>
              ) : (
                <Pending />
              )}
            </figure>
          </div>
        </Block>

        <Block id="look" blueprint={blueprint}>
          <ul className="flex flex-col gap-3">
            {visualScales.map((field) => (
              <ScaleRow key={field.id} field={field} value={readScale(blueprint, field.id)} />
            ))}
          </ul>
        </Block>
        <Block id="typography" blueprint={blueprint}>
          {font ? (
            <div className="flex flex-col gap-1">
              <p className="font-(family-name:--bp-heading) text-3xl leading-tight font-semibold">
                {font.name} headlines
              </p>
              <p className="max-w-full text-sm wrap-anywhere opacity-70">{typographyNote}</p>
            </div>
          ) : (
            <Pending />
          )}
        </Block>

        <Block id="color" blueprint={blueprint} className="@2xl:col-span-2">
          {expression.color.palette ? (
            <div className="flex flex-col gap-3">
              <ul className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
                {(["primary", "secondary", "accent", "background"] as const).map((role) => (
                  <li key={role} className="flex flex-col gap-1.5">
                    <span
                      className="h-16 rounded-lg shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)] transition-[background-color] duration-300"
                      style={{ backgroundColor: palette[role] }}
                    />
                    <span className="text-xs font-medium capitalize">{role}</span>
                    <span className="font-mono text-xs uppercase opacity-60">{palette[role]}</span>
                  </li>
                ))}
              </ul>
              {colorNote && (
                <p className="max-w-full text-sm wrap-anywhere opacity-70">{colorNote}</p>
              )}
            </div>
          ) : (
            <Pending />
          )}
        </Block>
      </div>
    </article>
  )
}

function Block({
  id,
  blueprint,
  className,
  children,
}: {
  id: SectionId
  blueprint: Blueprint
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3", className)}>
      <h3 className="max-w-full text-xs font-medium tracking-widest uppercase wrap-anywhere opacity-60">
        {slotText(blueprint, id, "title")}
      </h3>
      {children}
    </section>
  )
}

function Answer({ value }: { value: string }) {
  return value ? (
    <p className="max-w-full text-lg leading-snug text-pretty wrap-anywhere">{value}</p>
  ) : (
    <Pending />
  )
}

/** Placeholder for a section the session has not reached: the Blueprint "taking shape". */
function Pending() {
  return (
    <p className="rounded-lg border border-dashed border-current/20 px-3 py-2 text-sm opacity-50">
      Not captured yet
    </p>
  )
}

/** One scale in words, with its position between the two poles drawn as five dots. */
function ScaleRow({ field, value }: { field: ScaleField; value: ScaleValue }) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("font-medium", value === null && "opacity-40")}>
          {describeScale(field, value) ??
            `${field.left.label} or ${field.right.label.toLowerCase()}?`}
        </span>
      </div>
      <div
        className="flex items-center gap-2 text-xs"
        role="img"
        aria-label={
          value === null
            ? "Not captured yet"
            : `Position ${value} of 5 between ${field.left.label} and ${field.right.label}`
        }
      >
        <span className="w-24 shrink-0 opacity-60">{field.left.label}</span>
        <span className="flex flex-1 items-center justify-between">
          {[1, 2, 3, 4, 5].map((position) => (
            <span
              key={position}
              className={cn(
                "size-2 rounded-full transition-[background-color,scale] duration-300",
                position === value ? "scale-150 bg-(--bp-primary)" : "bg-current/25"
              )}
            />
          ))}
        </span>
        <span className="w-24 shrink-0 text-right opacity-60">{field.right.label}</span>
      </div>
    </li>
  )
}
