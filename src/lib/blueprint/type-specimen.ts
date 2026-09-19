export type TypeSpecimen = { label: string; stack: string }

export function deriveTypeSpecimen(typographyDirection: string): TypeSpecimen {
  const text = (typographyDirection || "").toLowerCase()

  if (/mono|technical|code/.test(text)) {
    return {
      label: "Monospace — technical, exact",
      stack: "'IBM Plex Mono', ui-monospace, monospace",
    }
  }

  if (/sans|geometric|clean|grotesk/.test(text)) {
    return {
      label: "Sans-serif — clear, contemporary",
      stack: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }
  }

  if (/slab/.test(text)) {
    return {
      label: "Slab serif — sturdy, editorial",
      stack: "'Rockwell', Georgia, serif",
    }
  }

  if (/serif|classic|editorial|book/.test(text)) {
    return {
      label: "Serif — considered, literary",
      stack: "'Lora', Georgia, serif",
    }
  }

  return {
    label: "Not specified — showing the house serif",
    stack: "var(--font-heading)",
  }
}
