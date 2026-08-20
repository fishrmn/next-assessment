import type { CtaElementConfig } from "./cta-element"
import type { ContactElementConfig } from "./contact-element"
import type { GalleryElementConfig } from "./gallery-element"
import type { HeroElementConfig } from "./hero-element"
import type { NavbarElementConfig } from "./navbar-element"
import type { ServicesElementConfig } from "./services-element"
import type { TextElementConfig } from "./text-element"

/**
 * Discriminated union of every builder element config. Configs are plain
 * serializable data (see TextElement) so they can be stored as JSON in the
 * database, edited in forms, and rendered by `ElementRenderer`.
 *
 * `id` is optional in stored data; the editor assigns one on load so elements
 * can be selected and reordered. Renderers ignore it.
 */
export type ElementConfig = (
  | NavbarElementConfig
  | TextElementConfig
  | HeroElementConfig
  | ServicesElementConfig
  | GalleryElementConfig
  | CtaElementConfig
  | ContactElementConfig
) & { id?: string }

export type ElementType = ElementConfig["type"]

/** A page is an ordered list of element configs. */
export type PageConfig = ElementConfig[]

export type Alignment = "left" | "center" | "right"
