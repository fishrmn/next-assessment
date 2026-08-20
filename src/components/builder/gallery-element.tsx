import { cn } from "@/lib/utils"

export type GalleryElementConfig = {
  type: "gallery"
  title?: string
  images: { src: string; alt: string }[]
  columns: 2 | 3 | 4
  rounded?: boolean
}

const columnStyles: Record<GalleryElementConfig["columns"], string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
}

export function GalleryElement({ config }: { config: GalleryElementConfig }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
      {config.title ? (
        <h2 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
          {config.title}
        </h2>
      ) : null}
      <div className={cn("grid gap-4", columnStyles[config.columns])}>
        {config.images.map((image, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- user-supplied remote URLs; next/image requires whitelisted hosts
          <img
            key={i}
            src={image.src}
            alt={image.alt}
            loading="lazy"
            className={cn(
              "aspect-square w-full object-cover",
              config.rounded ? "rounded-xl" : "rounded-none"
            )}
          />
        ))}
      </div>
    </section>
  )
}
