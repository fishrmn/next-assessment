import { ok, withErrorHandling } from "@/lib/api/respond"
import { ValidationError } from "@/lib/errors"
import { sanitizeText } from "@/lib/security/sanitize"
import { blueprintAiService } from "@/services/blueprint-ai-service"
import type { AiEditMode } from "@/services/blueprint-ai.types"

type RouteParams = { params: Promise<{ id: string }> }

const MODES: AiEditMode[] = ["generate", "revise"]
const MAX_INSTRUCTION_LENGTH = 500

export const POST = withErrorHandling(async (request: Request, context: RouteParams) => {
  const { id } = await context.params
  if (!/^[1-9]\d*$/.test(id)) {
    throw new ValidationError("id must be a positive integer")
  }

  const body = (await request.json().catch(() => null)) as {
    instruction?: unknown
    mode?: unknown
  } | null

  const mode = body?.mode ?? "generate"
  if (!MODES.includes(mode as AiEditMode)) {
    throw new ValidationError(`mode must be one of: ${MODES.join(", ")}`)
  }

  if (typeof body?.instruction !== "string") {
    throw new ValidationError("instruction must be a non-empty string")
  }

  const instruction = sanitizeText(body.instruction, MAX_INSTRUCTION_LENGTH)
  if (instruction.length === 0) {
    throw new ValidationError("instruction must be a non-empty string")
  }

  const blueprint = await blueprintAiService.applyInstruction(
    Number(id),
    mode as AiEditMode,
    instruction,
  )
  return ok(blueprint)
})
