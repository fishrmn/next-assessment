import { cn } from "@/lib/utils"

export type CtaElementConfig = {
  type: "cta"
  label: string
  href: string
  align: "left" | "center" | "right"
  /** Any valid CSS color for the button background. */
  backgroundColor?: string
  /** Any valid CSS color for the button label. */
  textColor?: string
  size: "sm" | "md" | "lg"
}

const alignStyles: Record<CtaElementConfig["align"], string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
}

const sizeStyles: Record<CtaElementConfig["size"], string> = {
  sm: "px-5 py-2 text-sm",
  md: "px-7 py-3 text-base",
  lg: "px-9 py-4 text-lg",
}

export function CtaElement({ config }: { config: CtaElementConfig }) {
  return (
    <div className={cn("mx-auto flex w-full max-w-4xl px-6 py-10", alignStyles[config.align])}>
      <a
        href={config.href}
        className={cn(
          "inline-flex items-center rounded-full bg-foreground font-medium text-background transition-opacity hover:opacity-85",
          sizeStyles[config.size]
        )}
        style={{
          backgroundColor: config.backgroundColor,
          color: config.textColor,
        }}
      >
        {config.label}
      </a>
    </div>
  )
}
