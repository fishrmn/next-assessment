"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const [clientName, setClientName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleStart() {
    if (!clientName.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: clientName.trim() }),
      })
      if (!res.ok) throw new Error("Failed to create blueprint")
      const { id } = await res.json()
      router.push(`/blueprint/${id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="eyebrow">Brand Blueprint Builder</p>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Every brand begins with a blueprint
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          Enter a client name to start a guided intake and build their Brand Blueprint.
        </p>
      </div>
      {/* Stacked below `sm`: a text input does not shrink past its intrinsic
          width, so side-by-side with the button this row overflowed a 320px
          viewport. Stacking also gives both controls a full-width tap target.
          `min-w-0` keeps the input honest once the row goes horizontal. */}
      <div className="rule-double flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <input
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleStart()
          }}
          placeholder="Client name"
        />
        <Button onClick={handleStart} disabled={!clientName.trim() || submitting}>
          Start a Blueprint
        </Button>
      </div>
    </div>
  )
}
