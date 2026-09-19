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

/** Shown until there is a palette: a neutral page that says "no color yet". */
const NEUTRAL = {
  primary: "#27272a",
  secondary: "#52525b",
  accent: "#a1a1aa",
  background: "#ffffff",
}

/**
 * While a person reviews a proposal, the document does two extra things:
 * it says where each part came from ("From you" or "Proposed"), and it lets the person
 * pick a section to talk about, so they never have to describe where the problem is.
 * Without this prop (the presentation route) the document is the plain deliverable.
 */
export type ReviewControls = {
  confirmed: boolean
  picked: SectionId | "direction" | null
  onPick: (id: SectionId | "direction") => void
}

/**
 * The Brand Blueprint one-pager.
 *
 * A pure render of the model: same Blueprint in, same page out. It wears the client's brand:
 * their palette and font pairing arrive as CSS variables on the root element. These are the only
 * raw color values in the app, and they are data, not styling decisions.
 *
 * Expression is shown as things a person can judge, with the settings behind them second:
 * a sentence in the brand's voice before the tone scales, the brand's name set in its type
 * before the font's name, the colors applied to a small sample before their hex codes.
 *
 * It lays itself out by its container (`@container`), never by the window, because it lives
 * in a panel and in a full-width presentation.
 */
export function BlueprintDocument({
  blueprint,
  review,
  className,
}: {
  blueprint: Blueprint
  review?: ReviewControls
  className?: string
}) {
  const { business, expression, direction } = blueprint
  const palette = expression.color.palette ?? NEUTRAL
  const font = fontInfo(expression.typography.pairing)

  const style = {
    "--bp-primary": palette.primary,
    "--bp-on-primary": readableOn(palette.primary),
    "--bp-secondary": palette.secondary,
    "--bp-accent": palette.accent,
    "--bp-on-accent": readableOn(palette.accent),
    "--bp-bg": palette.background,
    "--bp-ink": readableOn(palette.background),
    "--bp-heading": font?.heading ?? "var(--font-sans)",
    "--bp-body": font?.body ?? "var(--font-sans)",
  } as React.CSSProperties

  const text = (id: SectionId, key: "title" | "body") => slotText(blueprint, id, key)
  const lead = text("hero", "body")
  // The document adds the quotation marks; drop any the writer already put around the line.
  const sample = text("voice", "body").replace(/^[\s"“”«»']+|[\s"“”«»']+$/g, "")
  const brand = business.name || "Your brand"
  const toneScales = SCALES.filter((field) => field.group === "tone")
  const visualScales = SCALES.filter((field) => field.group === "visual")
  const block = { blueprint, review }

  return (
    <article
      style={style}
      className={cn(
        "@container overflow-hidden rounded-xl bg-(--bp-bg) font-(family-name:--bp-body) text-(--bp-ink) shadow-[0_0_0_1px_oklch(0_0_0/0.08),0_1px_2px_oklch(0_0_0/0.06),0_8px_24px_-8px_oklch(0_0_0/0.12)] transition-[background-color,color] duration-300",
        className
      )}
    >
      <Pickable
        as="header"
        id="hero"
        label={text("hero", "title")}
        review={review}
        inset
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
      </Pickable>

      <div className="grid gap-x-10 gap-y-9 p-6 @2xl:grid-cols-2 @2xl:p-10">
        {(direction.headline || direction.rationale) && (
          <Pickable
            id="direction"
            label="The direction"
            review={review}
            className="flex flex-col gap-2 @2xl:col-span-2"
          >
            <Heading source={review && !review.confirmed ? "Proposed" : undefined}>The direction</Heading>
            <p className="max-w-full font-(family-name:--bp-heading) text-2xl leading-tight font-semibold text-balance wrap-anywhere @2xl:text-3xl">
              {direction.headline}
            </p>
            {direction.rationale && (
              <p className="max-w-[70ch] text-base leading-snug text-pretty wrap-anywhere opacity-75">
                {direction.rationale}
              </p>
            )}
          </Pickable>
        )}

        <Block id="apart" source="From you" {...block}>
          <Answer value={text("apart", "body")} />
        </Block>
        <Block id="headed" source="From you" {...block}>
          <Answer value={text("headed", "body")} />
        </Block>
        <Block id="against" source="From you" {...block}>
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
        <Block id="personality" source="Proposed" {...block}>
          {expression.personality.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="font-(family-name:--bp-heading) text-2xl leading-tight font-semibold text-(--bp-primary) @2xl:text-3xl">
                {expression.personality.join(" · ")}
              </p>
              {text("personality", "body") && (
                <p className="max-w-full text-base leading-snug text-pretty wrap-anywhere opacity-75">
                  {text("personality", "body")}
                </p>
              )}
            </div>
          ) : (
            <Pending />
          )}
        </Block>

        <Block id="voice" source="Proposed" className="@2xl:col-span-2" {...block}>
          {sample ? (
            <figure className="flex flex-col gap-2 rounded-lg border-l-4 border-(--bp-accent) bg-current/5 p-5">
              <figcaption className="text-xs font-medium tracking-widest uppercase opacity-60">
                Sounds like
              </figcaption>
              <blockquote className="max-w-full font-(family-name:--bp-heading) text-xl leading-snug text-pretty wrap-anywhere @2xl:text-2xl">
                “{sample}”
              </blockquote>
            </figure>
          ) : (
            <Pending />
          )}
          <ul className="grid gap-x-10 gap-y-3 @2xl:grid-cols-2">
            {toneScales.map((field) => (
              <ScaleRow key={field.id} field={field} value={readScale(blueprint, field.id)} />
            ))}
          </ul>
        </Block>

        <Block id="typography" source="Proposed" {...block}>
          {font ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 rounded-lg bg-current/5 p-5">
                <p className="max-w-full font-(family-name:--bp-heading) text-3xl leading-none font-semibold wrap-anywhere">
                  {brand}
                </p>
                <p className="max-w-full font-(family-name:--bp-heading) text-lg leading-snug wrap-anywhere">
                  {direction.headline || lead || "A headline in this lettering"}
                </p>
                <p className="max-w-full text-sm leading-relaxed wrap-anywhere opacity-75">
                  {text("apart", "body") || "And this is how a paragraph of everyday text reads next to it."}
                </p>
              </div>
              <p className="max-w-full text-sm wrap-anywhere opacity-70">
                {font.name}. {text("typography", "body")}
              </p>
            </div>
          ) : (
            <Pending />
          )}
        </Block>
        <Block id="look" source="Proposed" {...block}>
          <ul className="flex flex-col gap-3">
            {visualScales.map((field) => (
              <ScaleRow key={field.id} field={field} value={readScale(blueprint, field.id)} />
            ))}
          </ul>
        </Block>

        <Block id="color" source="Proposed" className="@2xl:col-span-2" {...block}>
          {expression.color.palette ? (
            <div className="grid gap-5 @2xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
              {/* The colors doing their jobs, which is easier to judge than four squares. */}
              <div
                aria-hidden
                className="flex flex-col gap-3 rounded-lg p-4 shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)]"
              >
                <span className="w-fit rounded-full bg-(--bp-accent) px-2.5 py-0.5 text-xs font-medium text-(--bp-on-accent)">
                  New
                </span>
                <span className="max-w-full font-(family-name:--bp-heading) text-xl leading-tight font-semibold text-(--bp-secondary) wrap-anywhere">
                  {brand}
                </span>
                <span className="w-fit rounded-md bg-(--bp-primary) px-3 py-1.5 text-sm font-medium text-(--bp-on-primary)">
                  Get started
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <ul className="grid grid-cols-4 gap-2">
                  {(["primary", "secondary", "accent", "background"] as const).map((role) => (
                    <li key={role} className="flex min-w-0 flex-col gap-1">
                      <span
                        className="h-10 rounded-md shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)] transition-[background-color] duration-300"
                        style={{ backgroundColor: palette[role] }}
                      />
                      <span className="truncate text-xs font-medium capitalize">{role}</span>
                      <span className="truncate font-mono text-[0.6875rem] uppercase opacity-60">
                        {palette[role]}
                      </span>
                    </li>
                  ))}
                </ul>
                {text("color", "body") && (
                  <p className="max-w-full text-sm wrap-anywhere opacity-70">{text("color", "body")}</p>
                )}
              </div>
            </div>
          ) : (
            <Pending />
          )}
        </Block>
      </div>
    </article>
  )
}

/**
 * A part of the document the person can point at. In review it shows an outline on hover and
 * keeps it when picked; a click (or Enter/Space) picks it. The outline uses `currentColor`, so
 * it is visible on any client palette without a color of its own. Outside review it is a plain
 * element. `inset` keeps the outline inside parts that touch the document's edge.
 */
function Pickable({
  as: Tag = "section",
  id,
  label,
  review,
  inset = false,
  className,
  children,
}: {
  as?: "section" | "header"
  id: SectionId | "direction"
  label: string
  review?: ReviewControls
  inset?: boolean
  className?: string
  children: React.ReactNode
}) {
  if (!review) return <Tag className={className}>{children}</Tag>

  const picked = review.picked === id
  return (
    <Tag
      role="button"
      tabIndex={0}
      aria-pressed={picked}
      aria-label={`Talk about “${label}”`}
      data-picked={picked || undefined}
      onClick={() => review.onPick(id)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        review.onPick(id)
      }}
      className={cn(
        "relative cursor-pointer outline-2 outline-transparent transition-[outline-color] duration-150 ease-out hover:outline-current/30 focus-visible:outline-current/60 data-picked:outline-current/70",
        inset ? "-outline-offset-4" : "rounded-md outline-offset-8",
        className
      )}
    >
      {children}
    </Tag>
  )
}

function Heading({ source, children }: { source?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="max-w-full text-xs font-medium tracking-widest uppercase wrap-anywhere opacity-60">
        {children}
      </h3>
      {source && (
        <span className="shrink-0 rounded-full border border-current/20 px-2 py-0.5 text-[0.6875rem] leading-none font-medium opacity-60">
          {source}
        </span>
      )}
    </div>
  )
}

function Block({
  id,
  blueprint,
  review,
  source,
  className,
  children,
}: {
  id: SectionId
  blueprint: Blueprint
  review?: ReviewControls
  /** Where this part came from. Shown only while the person is still reviewing. */
  source: "From you" | "Proposed"
  className?: string
  children: React.ReactNode
}) {
  const title = slotText(blueprint, id, "title")
  return (
    <Pickable id={id} label={title} review={review} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <Heading source={review && !review.confirmed ? source : undefined}>{title}</Heading>
      {children}
    </Pickable>
  )
}

function Answer({ value }: { value: string }) {
  return value ? (
    <p className="max-w-full text-lg leading-snug text-pretty wrap-anywhere">{value}</p>
  ) : (
    <Pending />
  )
}

/** Placeholder for a part the conversation has not reached yet. */
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
      <span className={cn("text-sm font-medium", value === null && "opacity-40")}>
        {describeScale(field, value) ?? `${field.left.label} or ${field.right.label.toLowerCase()}?`}
      </span>
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
