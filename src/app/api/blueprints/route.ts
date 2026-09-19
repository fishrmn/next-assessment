import { ok, withErrorHandling } from "@/lib/api/respond"
import { ValidationError } from "@/lib/errors"
import { sanitizeText } from "@/lib/security/sanitize"
import { blueprintService } from "@/services/blueprint-service"

const MAX_CLIENT_NAME = 200

export const POST = withErrorHandling(async (request: Request) => {
  const body = (await request.json().catch(() => null)) as { clientName?: unknown } | null
  const clientName = body?.clientName

  if (
    typeof clientName !== "string" ||
    clientName.trim().length === 0 ||
    clientName.length > MAX_CLIENT_NAME
  ) {
    throw new ValidationError(
      `clientName must be a non-empty string of at most ${MAX_CLIENT_NAME} characters`,
    )
  }

  const blueprint = await blueprintService.createDraft(sanitizeText(clientName, MAX_CLIENT_NAME))
  return ok({ id: blueprint.id }, 201)
})
