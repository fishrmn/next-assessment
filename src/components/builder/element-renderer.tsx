import { memo } from "react"

import { ContactElement } from "./contact-element"
import { CtaElement } from "./cta-element"
import { GalleryElement } from "./gallery-element"
import { HeroElement } from "./hero-element"
import { NavbarElement } from "./navbar-element"
import { ServicesElement } from "./services-element"
import { TextElement } from "./text-element"
import type { ElementConfig, PageConfig } from "./types"

/**
 * Renders a single element config by dispatching on its `type`. Memoized:
 * the editor reducer replaces only the edited element's reference, so during
 * live editing every other element skips re-rendering.
 */
export const ElementRenderer = memo(function ElementRenderer({
  config,
}: {
  config: ElementConfig
}) {
  switch (config.type) {
    case "navbar":
      return <NavbarElement config={config} />
    case "text":
      return (
        <div className="mx-auto w-full max-w-4xl px-6 py-6">
          <TextElement config={config} />
        </div>
      )
    case "hero":
      return <HeroElement config={config} />
    case "services":
      return <ServicesElement config={config} />
    case "gallery":
      return <GalleryElement config={config} />
    case "cta":
      return <CtaElement config={config} />
    case "contact":
      return <ContactElement config={config} />
    default: {
      const exhaustive: never = config
      throw new Error(`Unknown element type: ${JSON.stringify(exhaustive)}`)
    }
  }
})

/**
 * Renders a full page config in order. Pure (no hooks), so it powers the
 * editor live preview, template thumbnails, and the public preview route.
 */
export function PageRenderer({ config }: { config: PageConfig }) {
  return (
    <div className="bg-background text-foreground">
      {config.map((element, i) => (
        <ElementRenderer key={element.id ?? i} config={element} />
      ))}
    </div>
  )
}
