import { cn } from "@/lib/utils"

export type HeroElementConfig = {
  type: "hero"
  heading: string
  subheading?: string
  align: "left" | "center" | "right"
  /** Any valid CSS color for the section background. */
  backgroundColor?: string
  /** Any valid CSS color for the heading/subheading text. */
  textColor?: string
  ctaLabel?: string
  ctaHref?: string
  /** Optional image URL — full-bleed background or side image per imageStyle. */
  imageUrl?: string
  /** "background" (default): behind a dark overlay. "side": rounded image next to the text. */
  imageStyle?: "background" | "side"
}

const alignStyles: Record<HeroElementConfig["align"], string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
}

function HeroContent({ config }: { config: HeroElementConfig }) {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        {config.heading}
      </h1>
      {config.subheading ? (
        <p className="max-w-2xl text-lg opacity-90 sm:text-xl">
          {config.subheading}
        </p>
      ) : null}
      {config.ctaLabel ? (
        <a
          href={config.ctaHref ?? "#"}
          className="mt-2 inline-flex w-fit items-center rounded-full border border-current px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
        >
          {config.ctaLabel}
        </a>
      ) : null}
    </>
  )
}

export function HeroElement({ config }: { config: HeroElementConfig }) {
  if (config.imageUrl && config.imageStyle === "side") {
    return (
      <section
        className="overflow-hidden"
        style={{ backgroundColor: config.backgroundColor }}
      >
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-6 py-16 sm:py-24 lg:grid-cols-2">
          <div
            className={cn("flex flex-col gap-4", alignStyles[config.align])}
            style={config.textColor ? { color: config.textColor } : undefined}
          >
            <HeroContent config={config} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied remote URLs; next/image requires whitelisted hosts */}
          <img
            src={config.imageUrl}
            alt=""
            className="max-h-[420px] w-full rounded-3xl object-cover shadow-lg"
          />
        </div>
      </section>
    )
  }

  const hasBackgroundImage = Boolean(config.imageUrl)
  return (
    <section
      className="relative overflow-hidden bg-cover bg-center"
      style={{
        backgroundColor: config.backgroundColor,
        backgroundImage: hasBackgroundImage
          ? `url(${config.imageUrl})`
          : undefined,
      }}
    >
      {hasBackgroundImage ? (
        <div aria-hidden className="absolute inset-0 bg-black/50" />
      ) : null}
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-20 sm:py-28",
          alignStyles[config.align]
        )}
        style={config.textColor ? { color: config.textColor } : undefined}
      >
        <HeroContent config={config} />
      </div>
    </section>
  )
}
