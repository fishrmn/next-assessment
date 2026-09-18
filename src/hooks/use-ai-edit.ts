import { useCallback, useState } from "react"
import type { AiEditMode, AiEditResult } from "@/services/blueprint-ai.types"

type AiEditStatus = "idle" | "loading" | "error"

const GENERIC_ERROR = "Something went wrong. Please try again."

export function useAiEdit(blueprintId: number) {
  const [status, setStatus] = useState<AiEditStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(
    async (instruction: string, mode: AiEditMode): Promise<AiEditResult | null> => {
      setStatus("loading")
      setError(null)
      try {
        const res = await fetch(`/api/blueprints/${blueprintId}/ai-edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction, mode }),
        })

        const body = await res.json().catch(() => ({}))

        if (!res.ok) {
          setStatus("error")
          setError(body.error ?? GENERIC_ERROR)
          return null
        }

        setStatus("idle")
        return { businessContext: body.businessContext, brandExpression: body.brandExpression }
      } catch {
        setStatus("error")
        setError(GENERIC_ERROR)
        return null
      }
    },
    [blueprintId]
  )

  return { status, error, apply }
}
