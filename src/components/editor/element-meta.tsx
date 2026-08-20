import {
  Contact,
  Image as ImageIcon,
  LayoutTemplate,
  MousePointerClick,
  PanelTop,
  Scissors,
  Type,
} from "lucide-react"

import type { ElementConfig, ElementType } from "@/components/builder/types"

/**
 * Editor-side registry for builder elements: display name, layers-panel icon,
 * and the config a freshly added element starts with. Rendering, forms, and
 * AI validation each keep their own exhaustive switch/table — the compiler
 * flags every place a new element type must be handled.
 */
type ElementMeta = {
  name: string
  icon: typeof Type
  defaultConfig: (id: string) => ElementConfig
}

export const elementMeta: Record<ElementType, ElementMeta> = {
  navbar: {
    name: "Navbar",
    icon: PanelTop,
    defaultConfig: (id) => ({
      id,
      type: "navbar",
      brandName: "Your Salon",
      links: [
        { label: "Services", href: "#" },
        { label: "Gallery", href: "#" },
        { label: "Contact", href: "#" },
      ],
      ctaLabel: "Book now",
      ctaHref: "#contact",
    }),
  },
  text: {
    name: "Text",
    icon: Type,
    defaultConfig: (id) => ({
      id,
      type: "text",
      text: "New text",
      level: "p",
      align: "left",
    }),
  },
  hero: {
    name: "Hero",
    icon: LayoutTemplate,
    defaultConfig: (id) => ({
      id,
      type: "hero",
      heading: "New section heading",
      subheading: "A short tagline goes here.",
      align: "center",
    }),
  },
  services: {
    name: "Services",
    icon: Scissors,
    defaultConfig: (id) => ({
      id,
      type: "services",
      title: "Services",
      columns: 2,
      items: [{ name: "New service", price: "$0" }],
    }),
  },
  gallery: {
    name: "Gallery",
    icon: ImageIcon,
    defaultConfig: (id) => ({
      id,
      type: "gallery",
      title: "Gallery",
      columns: 3,
      rounded: true,
      images: [
        { src: "https://picsum.photos/seed/new/600/600", alt: "New image" },
      ],
    }),
  },
  cta: {
    name: "Button",
    icon: MousePointerClick,
    defaultConfig: (id) => ({
      id,
      type: "cta",
      label: "Call to action",
      href: "#",
      align: "center",
      size: "md",
    }),
  },
  contact: {
    name: "Contact",
    icon: Contact,
    defaultConfig: (id) => ({
      id,
      type: "contact",
      title: "Contact",
      address: "123 Street, City",
      phone: "+1 555 0000",
      align: "left",
      hours: [],
    }),
  },
}

export const elementTypes = Object.keys(elementMeta) as ElementType[]

export function elementName(type: ElementType): string {
  return elementMeta[type].name
}

export function defaultElementConfig(type: ElementType): ElementConfig {
  return elementMeta[type].defaultConfig(crypto.randomUUID())
}
