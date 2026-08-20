"use client"

import { Plus, Trash2 } from "lucide-react"

import type { ContactElementConfig } from "@/components/builder/contact-element"
import type { CtaElementConfig } from "@/components/builder/cta-element"
import type { GalleryElementConfig } from "@/components/builder/gallery-element"
import type { NavbarElementConfig } from "@/components/builder/navbar-element"
import type { ServicesElementConfig } from "@/components/builder/services-element"
import type { TextElementConfig } from "@/components/builder/text-element"
import type { ElementConfig } from "@/components/builder/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import {
  AlignField,
  BooleanField,
  ColorField,
  SelectField,
  TextField,
  TextareaField,
} from "./fields"

type FormProps<T extends ElementConfig["type"]> = {
  config: Extract<ElementConfig, { type: T }>
  onChange: (patch: Partial<Extract<ElementConfig, { type: T }>>) => void
}

function NavbarForm({ config, onChange }: FormProps<"navbar">) {
  const updateLink = (
    index: number,
    patch: Partial<NavbarElementConfig["links"][number]>
  ) => {
    onChange({
      links: config.links.map((link, i) =>
        i === index ? { ...link, ...patch } : link
      ),
    })
  }

  return (
    <>
      <TextField
        label="Brand name"
        value={config.brandName}
        onChange={(brandName) => onChange({ brandName })}
      />
      <TextField
        label="Logo image URL"
        value={config.logoUrl ?? ""}
        placeholder="https://… (shown instead of the name)"
        onChange={(logoUrl) => onChange({ logoUrl: logoUrl || undefined })}
      />
      <ColorField
        label="Background color"
        value={config.backgroundColor}
        onChange={(backgroundColor) => onChange({ backgroundColor })}
      />
      <ColorField
        label="Text color"
        value={config.textColor}
        onChange={(textColor) => onChange({ textColor })}
      />
      <TextField
        label="Button label"
        value={config.ctaLabel ?? ""}
        onChange={(ctaLabel) => onChange({ ctaLabel: ctaLabel || undefined })}
      />
      <TextField
        label="Button link"
        value={config.ctaHref ?? ""}
        placeholder="#contact"
        onChange={(ctaHref) => onChange({ ctaHref: ctaHref || undefined })}
      />
      <Separator />
      <Label>Menu links</Label>
      {config.links.map((link, index) => (
        <div key={index} className="flex gap-2">
          <Input
            aria-label={`Link ${index + 1} label`}
            value={link.label}
            placeholder="Label"
            onChange={(e) => updateLink(index, { label: e.target.value })}
          />
          <Input
            aria-label={`Link ${index + 1} URL`}
            value={link.href}
            placeholder="#"
            onChange={(e) => updateLink(index, { href: e.target.value })}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove link ${index + 1}`}
            onClick={() =>
              onChange({ links: config.links.filter((_, i) => i !== index) })
            }
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({ links: [...config.links, { label: "New link", href: "#" }] })
        }
      >
        <Plus data-icon="inline-start" />
        Add link
      </Button>
    </>
  )
}

function TextForm({ config, onChange }: FormProps<"text">) {
  return (
    <>
      <TextareaField
        label="Text"
        value={config.text}
        onChange={(text) => onChange({ text })}
      />
      <SelectField
        label="Level"
        value={config.level}
        options={[
          { value: "h1", label: "Heading 1" },
          { value: "h2", label: "Heading 2" },
          { value: "h3", label: "Heading 3" },
          { value: "p", label: "Paragraph" },
        ]}
        onChange={(level) =>
          onChange({ level: level as TextElementConfig["level"] })
        }
      />
      <AlignField value={config.align} onChange={(align) => onChange({ align })} />
      <ColorField
        label="Text color"
        value={config.color}
        onChange={(color) => onChange({ color })}
      />
    </>
  )
}

function HeroForm({ config, onChange }: FormProps<"hero">) {
  return (
    <>
      <TextField
        label="Heading"
        value={config.heading}
        onChange={(heading) => onChange({ heading })}
      />
      <TextareaField
        label="Subheading"
        value={config.subheading ?? ""}
        onChange={(subheading) =>
          onChange({ subheading: subheading || undefined })
        }
      />
      <AlignField value={config.align} onChange={(align) => onChange({ align })} />
      <ColorField
        label="Background color"
        value={config.backgroundColor}
        onChange={(backgroundColor) => onChange({ backgroundColor })}
      />
      <ColorField
        label="Text color"
        value={config.textColor}
        onChange={(textColor) => onChange({ textColor })}
      />
      <TextField
        label="Background image URL"
        value={config.imageUrl ?? ""}
        placeholder="https://…"
        onChange={(imageUrl) => onChange({ imageUrl: imageUrl || undefined })}
      />
      <SelectField
        label="Image style"
        value={config.imageStyle ?? "background"}
        options={[
          { value: "background", label: "Background (dark overlay)" },
          { value: "side", label: "Beside the text" },
        ]}
        onChange={(imageStyle) =>
          onChange({ imageStyle: imageStyle as "background" | "side" })
        }
      />
      <TextField
        label="Button label"
        value={config.ctaLabel ?? ""}
        onChange={(ctaLabel) => onChange({ ctaLabel: ctaLabel || undefined })}
      />
      <TextField
        label="Button link"
        value={config.ctaHref ?? ""}
        placeholder="#contact"
        onChange={(ctaHref) => onChange({ ctaHref: ctaHref || undefined })}
      />
    </>
  )
}

function ServicesForm({ config, onChange }: FormProps<"services">) {
  const updateItem = (
    index: number,
    patch: Partial<ServicesElementConfig["items"][number]>
  ) => {
    onChange({
      items: config.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    })
  }

  return (
    <>
      <TextField
        label="Title"
        value={config.title}
        onChange={(title) => onChange({ title })}
      />
      <SelectField
        label="Columns"
        value={String(config.columns)}
        options={[
          { value: "1", label: "1 column" },
          { value: "2", label: "2 columns" },
          { value: "3", label: "3 columns" },
        ]}
        onChange={(columns) =>
          onChange({ columns: Number(columns) as ServicesElementConfig["columns"] })
        }
      />
      <ColorField
        label="Accent color"
        value={config.accentColor}
        onChange={(accentColor) => onChange({ accentColor })}
      />
      <Separator />
      <Label>Services</Label>
      {config.items.map((item, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex gap-2">
            <Input
              aria-label={`Service ${index + 1} name`}
              value={item.name}
              placeholder="Service"
              onChange={(e) => updateItem(index, { name: e.target.value })}
            />
            <Input
              aria-label={`Service ${index + 1} price`}
              value={item.price}
              placeholder="$0"
              className="w-24"
              onChange={(e) => updateItem(index, { price: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove service ${index + 1}`}
              onClick={() =>
                onChange({ items: config.items.filter((_, i) => i !== index) })
              }
            >
              <Trash2 />
            </Button>
          </div>
          <Input
            aria-label={`Service ${index + 1} description`}
            value={item.description ?? ""}
            placeholder="Description (optional)"
            onChange={(e) =>
              updateItem(index, { description: e.target.value || undefined })
            }
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({ items: [...config.items, { name: "New service", price: "$0" }] })
        }
      >
        <Plus data-icon="inline-start" />
        Add service
      </Button>
    </>
  )
}

function GalleryForm({ config, onChange }: FormProps<"gallery">) {
  const updateImage = (
    index: number,
    patch: Partial<GalleryElementConfig["images"][number]>
  ) => {
    onChange({
      images: config.images.map((image, i) =>
        i === index ? { ...image, ...patch } : image
      ),
    })
  }

  return (
    <>
      <TextField
        label="Title"
        value={config.title ?? ""}
        onChange={(title) => onChange({ title: title || undefined })}
      />
      <SelectField
        label="Columns"
        value={String(config.columns)}
        options={[
          { value: "2", label: "2 columns" },
          { value: "3", label: "3 columns" },
          { value: "4", label: "4 columns" },
        ]}
        onChange={(columns) =>
          onChange({ columns: Number(columns) as GalleryElementConfig["columns"] })
        }
      />
      <BooleanField
        label="Rounded corners"
        value={config.rounded ?? false}
        onChange={(rounded) => onChange({ rounded })}
      />
      <Separator />
      <Label>Images</Label>
      {config.images.map((image, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex gap-2">
            <Input
              aria-label={`Image ${index + 1} URL`}
              value={image.src}
              placeholder="https://…"
              onChange={(e) => updateImage(index, { src: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove image ${index + 1}`}
              onClick={() =>
                onChange({ images: config.images.filter((_, i) => i !== index) })
              }
            >
              <Trash2 />
            </Button>
          </div>
          <Input
            aria-label={`Image ${index + 1} alt text`}
            value={image.alt}
            placeholder="Describe the image"
            onChange={(e) => updateImage(index, { alt: e.target.value })}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({
            images: [
              ...config.images,
              {
                src: `https://picsum.photos/seed/img${config.images.length + 1}/600/600`,
                alt: "New image",
              },
            ],
          })
        }
      >
        <Plus data-icon="inline-start" />
        Add image
      </Button>
    </>
  )
}

function CtaForm({ config, onChange }: FormProps<"cta">) {
  return (
    <>
      <TextField
        label="Label"
        value={config.label}
        onChange={(label) => onChange({ label })}
      />
      <TextField
        label="Link"
        value={config.href}
        placeholder="#contact"
        onChange={(href) => onChange({ href })}
      />
      <AlignField value={config.align} onChange={(align) => onChange({ align })} />
      <SelectField
        label="Size"
        value={config.size}
        options={[
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
        ]}
        onChange={(size) => onChange({ size: size as CtaElementConfig["size"] })}
      />
      <ColorField
        label="Button color"
        value={config.backgroundColor}
        onChange={(backgroundColor) => onChange({ backgroundColor })}
      />
      <ColorField
        label="Label color"
        value={config.textColor}
        onChange={(textColor) => onChange({ textColor })}
      />
    </>
  )
}

function ContactForm({ config, onChange }: FormProps<"contact">) {
  const updateRow = (
    index: number,
    patch: Partial<ContactElementConfig["hours"][number]>
  ) => {
    onChange({
      hours: config.hours.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    })
  }

  return (
    <>
      <TextField
        label="Title"
        value={config.title}
        onChange={(title) => onChange({ title })}
      />
      <TextField
        label="Address"
        value={config.address}
        onChange={(address) => onChange({ address })}
      />
      <TextField
        label="Phone"
        value={config.phone}
        onChange={(phone) => onChange({ phone })}
      />
      <TextField
        label="Email"
        value={config.email ?? ""}
        onChange={(email) => onChange({ email: email || undefined })}
      />
      <AlignField value={config.align} onChange={(align) => onChange({ align })} />
      <Separator />
      <Label>Opening hours</Label>
      {config.hours.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input
            aria-label={`Hours row ${index + 1} days`}
            value={row.days}
            placeholder="Mon – Fri"
            onChange={(e) => updateRow(index, { days: e.target.value })}
          />
          <Input
            aria-label={`Hours row ${index + 1} hours`}
            value={row.hours}
            placeholder="9am – 6pm"
            onChange={(e) => updateRow(index, { hours: e.target.value })}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove hours row ${index + 1}`}
            onClick={() =>
              onChange({ hours: config.hours.filter((_, i) => i !== index) })
            }
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          onChange({ hours: [...config.hours, { days: "Mon – Fri", hours: "9am – 6pm" }] })
        }
      >
        <Plus data-icon="inline-start" />
        Add hours
      </Button>
    </>
  )
}

export function ElementForm({
  config,
  onChange,
}: {
  config: ElementConfig
  onChange: (patch: Partial<ElementConfig>) => void
}) {
  switch (config.type) {
    case "navbar":
      return <NavbarForm config={config} onChange={onChange} />
    case "text":
      return <TextForm config={config} onChange={onChange} />
    case "hero":
      return <HeroForm config={config} onChange={onChange} />
    case "services":
      return <ServicesForm config={config} onChange={onChange} />
    case "gallery":
      return <GalleryForm config={config} onChange={onChange} />
    case "cta":
      return <CtaForm config={config} onChange={onChange} />
    case "contact":
      return <ContactForm config={config} onChange={onChange} />
  }
}
