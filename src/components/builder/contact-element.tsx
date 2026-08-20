import { cn } from "@/lib/utils"

export type ContactElementConfig = {
  type: "contact"
  title: string
  address: string
  phone: string
  email?: string
  hours: { days: string; hours: string }[]
  align: "left" | "center" | "right"
}

const alignStyles: Record<ContactElementConfig["align"], string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

export function ContactElement({ config }: { config: ContactElementConfig }) {
  return (
    <section className={cn("mx-auto w-full max-w-4xl px-6 py-12 sm:py-16", alignStyles[config.align])}>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {config.title}
      </h2>
      <address className="mt-6 space-y-1 text-base not-italic leading-7">
        <p>{config.address}</p>
        <p>
          <a href={`tel:${config.phone}`} className="underline-offset-4 hover:underline">
            {config.phone}
          </a>
        </p>
        {config.email ? (
          <p>
            <a href={`mailto:${config.email}`} className="underline-offset-4 hover:underline">
              {config.email}
            </a>
          </p>
        ) : null}
      </address>
      {config.hours.length > 0 ? (
        <dl className="mt-6 space-y-1 text-sm text-muted-foreground">
          {config.hours.map((row, i) => (
            <div key={i} className="flex flex-wrap gap-x-3 gap-y-0.5 data-[align=center]:justify-center data-[align=right]:justify-end" data-align={config.align}>
              <dt className="font-medium text-foreground">{row.days}</dt>
              <dd>{row.hours}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
