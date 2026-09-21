import { Geist, Geist_Mono, Lora, Nunito, Playfair_Display, Space_Grotesk } from "next/font/google"

/**
 * Every font the app can show. Geist is the app's own UI font; the others exist
 * only so a Blueprint can be rendered in the client's typography direction
 * (see `FONTS` in `src/lib/blueprint/registry.ts`, which refers to these variables).
 */
const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" })
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" })

export const fontVariables = [geistSans, geistMono, playfair, nunito, grotesk, lora]
  .map((font) => font.variable)
  .join(" ")
