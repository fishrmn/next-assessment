"use client"

import { ImagePlus, Loader2, Send, Sparkles } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"

import { brandChatAction, createBrandPageAction } from "@/app/actions"
import { PageRenderer } from "@/components/builder/element-renderer"
import type { PageConfig } from "@/components/builder/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  BrandDirection,
  BrandProfile,
  BrandState,
} from "@/lib/ai/brand-types"
import { downscaleImage } from "@/lib/image"
import { cn } from "@/lib/utils"

type TranscriptEntry = {
  role: "user" | "assistant"
  text: string
  imageDataUrl?: string
  profile?: BrandProfile
  directions?: BrandDirection[]
  page?: { config: PageConfig; summary: string }
}

const GREETING =
  "Hi! I'm your brand consultant. Together we'll figure out what your salon's website should look like — then I'll build the first version for you. To start: what's your salon called, and what services do you offer?"

export function BrandChat() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    { role: "assistant", text: GREETING },
  ])
  const [state, setState] = useState<BrandState>({})
  const [draft, setDraft] = useState("")
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const generated = transcript.find((entry) => entry.page)?.page ?? null

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" })
  }, [transcript, isPending])

  function send(text: string, imageDataUrl?: string) {
    const userEntry: TranscriptEntry = { role: "user", text, imageDataUrl }
    const nextTranscript = [...transcript, userEntry]
    setTranscript(nextTranscript)
    setDraft("")
    setPendingImage(null)
    setError(null)

    startTransition(async () => {
      // Only the latest logo is sent as image data — the agent only looks at
      // that one, and older data URLs would bloat every request.
      const lastImageIndex = nextTranscript.reduce(
        (last, entry, index) => (entry.imageDataUrl ? index : last),
        -1
      )
      const result = await brandChatAction({
        messages: nextTranscript.map(({ role, text, imageDataUrl }, index) => ({
          role,
          text:
            imageDataUrl && index !== lastImageIndex
              ? `${text} [logo image was attached]`
              : text,
          imageDataUrl: index === lastImageIndex ? imageDataUrl : undefined,
        })),
        state,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      const { data } = result
      setState(data.state)
      setTranscript((current) => [
        ...current,
        {
          role: "assistant",
          text: data.message,
          profile: data.profile,
          directions: data.directions,
          page: data.page,
        },
      ])
    })
  }

  function handleSend() {
    if (isPending || (!draft.trim() && !pendingImage)) return
    send(draft.trim(), pendingImage ?? undefined)
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    try {
      setPendingImage(await downscaleImage(file))
    } catch {
      setError("Could not read the image. Try a different file.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-h-[60dvh] min-h-72 flex-col gap-4 overflow-y-auto rounded-xl border bg-muted/30 p-4">
        {transcript.map((entry, index) => (
          <div key={index} className="flex flex-col gap-3">
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                entry.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start border bg-background"
              )}
            >
              {entry.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
                <img
                  src={entry.imageDataUrl}
                  alt="Uploaded logo"
                  className="mb-2 max-h-24 rounded-md"
                />
              ) : null}
              <p className="whitespace-pre-wrap">{entry.text}</p>
            </div>
            {entry.profile ? <PaletteCard profile={entry.profile} /> : null}
            {entry.directions ? (
              <DirectionCards
                directions={entry.directions}
                disabled={isPending || Boolean(generated)}
                onChoose={(direction) =>
                  send(`I choose direction ${direction.id}: ${direction.name}`)
                }
              />
            ) : null}
            {entry.page ? (
              <GeneratedPageCard
                page={entry.page}
                defaultName={state.profile?.salonName ?? ""}
              />
            ) : null}
          </div>
        ))}
        {isPending ? (
          <div className="flex items-center gap-2 self-start text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Thinking…
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {pendingImage ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
            <img
              src={pendingImage}
              alt="Logo ready to send"
              className="size-12 rounded-md border object-cover"
            />
            <Button variant="ghost" size="sm" onClick={() => setPendingImage(null)}>
              Remove
            </Button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload your logo"
            onChange={(e) => {
              void handleFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Attach logo"
            disabled={isPending || Boolean(generated)}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus />
          </Button>
          <Textarea
            aria-label="Message the brand assistant"
            value={draft}
            rows={2}
            placeholder={
              generated
                ? "Your page is ready — create it above to keep editing."
                : "Tell me about your salon…"
            }
            disabled={isPending || Boolean(generated)}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            aria-label="Send message"
            disabled={isPending || Boolean(generated) || (!draft.trim() && !pendingImage)}
            onClick={handleSend}
          >
            <Send />
          </Button>
        </div>
      </div>
    </div>
  )
}

function PaletteCard({ profile }: { profile: BrandProfile }) {
  const swatches = [
    { label: "Primary", color: profile.palette.primary },
    { label: "Secondary", color: profile.palette.secondary },
    { label: "Accent", color: profile.palette.accent },
    { label: "Background", color: profile.palette.background },
  ]
  return (
    <Card className="gap-3 self-start p-4" data-testid="palette-card">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden />
        <span className="text-sm font-semibold">
          {profile.salonName} — brand profile
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {profile.vibeWords.map((word) => (
          <Badge key={word} variant="secondary">
            {word}
          </Badge>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {swatches.map((swatch) => (
          <div key={swatch.label} className="flex flex-col gap-1">
            <div
              className="h-10 rounded-md border"
              style={{ backgroundColor: swatch.color }}
              aria-label={`${swatch.label} color ${swatch.color}`}
            />
            <span className="text-xs text-muted-foreground">
              {swatch.label} · {swatch.color}
            </span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{profile.paletteReasoning}</p>
    </Card>
  )
}

function DirectionCards({
  directions,
  disabled,
  onChoose,
}: {
  directions: BrandDirection[]
  disabled: boolean
  onChoose: (direction: BrandDirection) => void
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {directions.map((direction) => (
        <Card key={direction.id} className="gap-2 p-4">
          <span className="text-sm font-semibold">{direction.name}</span>
          <p className="text-sm text-muted-foreground">
            {direction.visualDescription}
          </p>
          <dl className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div>
              <dt className="inline font-medium text-foreground">Layout: </dt>
              <dd className="inline">{direction.layoutApproach}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">Type: </dt>
              <dd className="inline">{direction.typography}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">Color: </dt>
              <dd className="inline">{direction.colorUsage}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">Hero: </dt>
              <dd className="inline">{direction.heroConcept}</dd>
            </div>
          </dl>
          <Button
            size="sm"
            className="mt-1"
            disabled={disabled}
            onClick={() => onChoose(direction)}
          >
            Choose this direction
          </Button>
        </Card>
      ))}
    </div>
  )
}

function GeneratedPageCard({
  page,
  defaultName,
}: {
  page: { config: PageConfig; summary: string }
  defaultName: string
}) {
  const [name, setName] = useState(defaultName)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createBrandPageAction({ name, config: page.config })
      // On success the action redirects, so a result only arrives on failure.
      if (result && !result.ok) setError(result.error)
    })
  }

  return (
    <Card className="gap-3 p-4" data-testid="generated-page-card">
      <div
        aria-hidden
        className="pointer-events-none h-44 select-none overflow-hidden rounded-lg border bg-muted"
      >
        <div className="h-[800px] w-[1000px] origin-top-left scale-[0.28]">
          <PageRenderer config={page.config} />
        </div>
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <Label htmlFor="brand-page-name">Page name</Label>
        <div className="flex gap-2">
          <Input
            id="brand-page-name"
            value={name}
            placeholder="e.g. My salon"
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Create page & open editor
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
