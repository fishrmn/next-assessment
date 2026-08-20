import type { PageConfig } from "@/components/builder/types"

/**
 * The three salon starting templates. Each is just a `PageConfig` preset —
 * distinctness comes from element order, copy, colors, and alignment, so the
 * same renderer and editor work for all of them.
 */
export type TemplateId = "elegance" | "moderna" | "lush"

export type Template = {
  id: TemplateId
  name: string
  description: string
  config: PageConfig
}

const elegance: Template = {
  id: "elegance",
  name: "Elegance",
  description: "Warm and serene — ivory, soft gold, spa-like calm.",
  config: [
    {
      type: "navbar",
      brandName: "Maison Élégance",
      links: [
        { label: "Home", href: "#" },
        { label: "Services", href: "#" },
        { label: "Gallery", href: "#" },
        { label: "Contact", href: "#contact" },
      ],
      backgroundColor: "#faf7f0",
      textColor: "#3f3528",
      ctaLabel: "Book now",
      ctaHref: "#contact",
    },
    {
      type: "hero",
      heading: "Elevate Your Style, Define Your Confidence",
      subheading:
        "Experience personalized spa and wellness care that nurtures your body, mind, and spirit.",
      align: "left",
      backgroundColor: "#faf7f0",
      textColor: "#3f3528",
      ctaLabel: "Book an appointment",
      ctaHref: "#contact",
      imageUrl:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=700&fit=crop&q=80&auto=format",
      imageStyle: "side",
    },
    {
      type: "text",
      text: "Trusted by over 1.5M happy clients — quality care should be more than a service. It should be a seamless part of your daily life, from A to Z.",
      level: "p",
      align: "center",
      color: "#8c7c64",
    },
    {
      type: "services",
      title: "Choose your plan",
      columns: 3,
      accentColor: "#b3854d",
      items: [
        {
          name: "Salon services",
          price: "from $45",
          description: "Precision cuts, color, and styling — 8 services available.",
        },
        {
          name: "Spa services",
          price: "from $60",
          description: "Massage, aromatherapy, and full-body rituals to restore you.",
        },
        {
          name: "Beauty parlour",
          price: "from $35",
          description: "Skincare, brows, and bridal looks for every occasion.",
        },
      ],
    },
    {
      type: "gallery",
      title: "Your daily care",
      columns: 4,
      rounded: true,
      images: [
        {
          src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Relaxing body massage with warm oils",
        },
        {
          src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Spa essentials — towels, lotion, and candlelight",
        },
        {
          src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Skin brightening facial treatment",
        },
        {
          src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Our calm, light-filled salon floor",
        },
      ],
    },
    {
      type: "text",
      text: "“I had an absolutely wonderful experience at this spa and salon. From the moment I walked in, the atmosphere was calm, clean, and welcoming.” — Nikulas B.",
      level: "h3",
      align: "center",
      color: "#5c5142",
    },
    {
      type: "cta",
      label: "Book an appointment",
      href: "#contact",
      align: "center",
      size: "lg",
      backgroundColor: "#b3854d",
      textColor: "#ffffff",
    },
    {
      type: "contact",
      title: "Visit us",
      address: "12 Rue Belle, Old Town",
      phone: "+1 555 0182",
      email: "hello@maison-elegance.test",
      align: "center",
      hours: [
        { days: "Tue – Fri", hours: "10am – 7pm" },
        { days: "Sat", hours: "9am – 5pm" },
      ],
    },
  ],
}

const moderna: Template = {
  id: "moderna",
  name: "Moderna",
  description: "Editorial dusty rose — soft, warm, magazine-like.",
  config: [
    {
      type: "navbar",
      brandName: "Salon Moderna",
      links: [
        { label: "About", href: "#" },
        { label: "Services", href: "#" },
        { label: "Team", href: "#" },
      ],
      backgroundColor: "#dca291",
      textColor: "#2e211b",
      ctaLabel: "Book appointment",
      ctaHref: "#contact",
    },
    {
      type: "hero",
      heading: "Welcome to Salon Moderna",
      subheading:
        "A fresh take on hair — cuts, color, and care from the city's top stylists.",
      align: "left",
      backgroundColor: "#dca291",
      textColor: "#2e211b",
      ctaLabel: "Book appointment",
      ctaHref: "#contact",
      imageUrl:
        "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=900&h=700&fit=crop&q=80&auto=format",
      imageStyle: "side",
    },
    {
      type: "text",
      text: "Our commitment to quality keeps our clients happy. With years of experience and continuing education, our dedicated team is ready to serve your beauty needs — and help you decide the best look.",
      level: "p",
      align: "left",
      color: "#6e5a4e",
    },
    {
      type: "services",
      title: "Our services",
      columns: 2,
      accentColor: "#bd7861",
      items: [
        {
          name: "Haircuts & styling",
          price: "$120",
          description: "Consultation, shaping, and a finished style.",
        },
        {
          name: "Color correction",
          price: "$180",
          description: "Even, dimensional color that wears beautifully.",
        },
        {
          name: "Curly perms",
          price: "$150",
          description: "Soft, lasting waves tailored to your hair.",
        },
        {
          name: "Hair treatments",
          price: "$250",
          description: "Repair and shine for over-worked hair.",
        },
      ],
    },
    {
      type: "gallery",
      title: "The team & the salon",
      columns: 3,
      rounded: true,
      images: [
        {
          src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=800&fit=crop&q=80&auto=format",
          alt: "Make yourself at home — our rose styling chairs",
        },
        {
          src: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&h=800&fit=crop&q=80&auto=format",
          alt: "Wash and care by the city's top stylists",
        },
        {
          src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=800&fit=crop&q=80&auto=format",
          alt: "A fresh blowout in progress",
        },
      ],
    },
    {
      type: "cta",
      label: "Book appointment",
      href: "#contact",
      align: "left",
      size: "lg",
      backgroundColor: "#2e211b",
      textColor: "#f5eee6",
    },
    {
      type: "contact",
      title: "Visit the salon",
      address: "3222 Blackwell Street, Fairbanks, AK 99701",
      phone: "+070 6754 78684",
      email: "support@salonmoderna.test",
      align: "left",
      hours: [
        { days: "Mon – Sat", hours: "11am – 8pm" },
      ],
    },
  ],
}

const lush: Template = {
  id: "lush",
  name: "Lush",
  description: "Colorful and playful — pink, violet, and plenty of photos.",
  config: [
    {
      type: "navbar",
      brandName: "Lush & Lovely",
      links: [
        { label: "Fresh looks", href: "#" },
        { label: "Treat yourself", href: "#" },
        { label: "Say hello", href: "#contact" },
      ],
      backgroundColor: "#fdf2f8",
      textColor: "#86198f",
      ctaLabel: "Come say hi",
      ctaHref: "#contact",
    },
    {
      type: "hero",
      heading: "Lush & Lovely",
      subheading: "Good hair days, every day. Walk-ins welcome!",
      align: "center",
      backgroundColor: "#fdf2f8",
      textColor: "#86198f",
      ctaLabel: "Come say hi",
      ctaHref: "#contact",
      imageUrl:
        "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=900&h=700&fit=crop&q=80&auto=format",
      imageStyle: "side",
    },
    {
      type: "gallery",
      title: "Fresh from the chair",
      columns: 3,
      rounded: true,
      images: [
        {
          src: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Vivid violet color, soft waves",
        },
        {
          src: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Pink mani moment",
        },
        {
          src: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Glam makeup touch-up",
        },
        {
          src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Happy blowout, happy client",
        },
        {
          src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Fresh fade energy",
        },
        {
          src: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=600&fit=crop&q=80&auto=format",
          alt: "Sharp razor details",
        },
      ],
    },
    {
      type: "services",
      title: "Treat yourself",
      columns: 3,
      accentColor: "#db2777",
      items: [
        { name: "Color pop", price: "$95", description: "Vivids, pastels, rainbows." },
        { name: "Curly cut", price: "$65", description: "Cut dry, shaped for your curls." },
        { name: "Mani + pedi", price: "$58", description: "With art, always." },
      ],
    },
    {
      type: "text",
      text: "Bring your playlist, leave with your dream hair. 💖",
      level: "h3",
      align: "center",
      color: "#db2777",
    },
    {
      type: "cta",
      label: "Book a chair",
      href: "#contact",
      align: "center",
      size: "md",
      backgroundColor: "#db2777",
      textColor: "#ffffff",
    },
    {
      type: "contact",
      title: "Say hello",
      address: "7 Peach Lane, Sunnyside",
      phone: "+1 555 0177",
      email: "hi@lushlovely.test",
      align: "center",
      hours: [
        { days: "Mon – Fri", hours: "9am – 6pm" },
        { days: "Sat – Sun", hours: "10am – 4pm" },
      ],
    },
  ],
}

export const templates: Record<TemplateId, Template> = {
  elegance,
  moderna,
  lush,
}

export const templateList: Template[] = [elegance, moderna, lush]

export function getTemplate(id: string): Template | null {
  return id in templates ? templates[id as TemplateId] : null
}
