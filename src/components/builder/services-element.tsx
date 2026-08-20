import { cn } from "@/lib/utils"

export type ServicesElementConfig = {
  type: "services"
  title: string
  items: { name: string; price: string; description?: string }[]
  columns: 1 | 2 | 3
  /** Any valid CSS color, used for prices and the title underline. */
  accentColor?: string
}

const columnStyles: Record<ServicesElementConfig["columns"], string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}

export function ServicesElement({ config }: { config: ServicesElementConfig }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {config.title}
      </h2>
      <div
        aria-hidden
        className="mt-2 h-1 w-12 rounded-full bg-foreground"
        style={config.accentColor ? { backgroundColor: config.accentColor } : undefined}
      />
      <ul className={cn("mt-8 grid gap-6", columnStyles[config.columns])}>
        {config.items.map((item, i) => (
          <li key={i} className="rounded-lg border p-5">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-medium">{item.name}</h3>
              <span
                className="shrink-0 font-semibold"
                style={config.accentColor ? { color: config.accentColor } : undefined}
              >
                {item.price}
              </span>
            </div>
            {item.description ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
