import { cn } from "@/lib/utils"

/**
 * Example builder element.
 *
 * This demonstrates one possible pattern for builder components: a plain,
 * serializable config object in, rendered HTML out. Because the config is
 * just data, it can be stored in the database, edited in a form, or
 * rewritten by an AI — the component doesn't care where it came from.
 *
 * You are free to keep, extend, or replace this pattern entirely.
 */
export type TextElementConfig = {
  type: "text"
  /** The text content to render. */
  text: string
  /** Semantic level — affects both the tag and default sizing. */
  level: "h1" | "h2" | "h3" | "p"
  align: "left" | "center" | "right"
  /** Any valid CSS color, e.g. "#1a1a1a" or "tomato". */
  color?: string
}

const levelStyles: Record<TextElementConfig["level"], string> = {
  h1: "font-heading text-4xl font-bold tracking-tight sm:text-5xl",
  h2: "font-heading text-2xl font-semibold tracking-tight sm:text-3xl",
  h3: "text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase",
  p: "text-base leading-7",
}

const alignStyles: Record<TextElementConfig["align"], string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

export function TextElement({ config }: { config: TextElementConfig }) {
  const Tag = config.level

  return (
    <Tag
      className={cn(levelStyles[config.level], alignStyles[config.align])}
      style={config.color ? { color: config.color } : undefined}
    >
      {config.text}
    </Tag>
  )
}
