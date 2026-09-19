import { ok, withErrorHandling } from "@/lib/api/respond"
import { ValidationError } from "@/lib/errors"
import { blueprintService } from "@/services/blueprint-service"
import type { UpdateBlueprintPatch } from "@/services/blueprint.types"

type RouteParams = { params: Promise<{ id: string }> }

const PATCH_KEYS = ["clientName", "businessContext", "brandExpression"] as const

async function parseId({ params }: RouteParams): Promise<number> {
  const { id } = await params
  if (!/^[1-9]\d*$/.test(id)) {
    throw new ValidationError("id must be a positive integer")
  }
  return Number(id)
}

export const GET = withErrorHandling(async (_request: Request, context: RouteParams) => {
  const blueprint = await blueprintService.getById(await parseId(context))
  return ok(blueprint)
})

export const PATCH = withErrorHandling(async (request: Request, context: RouteParams) => {
  const id = await parseId(context)
  const body = await request.json().catch(() => null)

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("body must be an object")
  }

  // Only recognised keys reach the service; anything else is dropped.
  const source = body as Record<string, unknown>
  const patch = Object.fromEntries(
    PATCH_KEYS.filter((key) => key in source).map((key) => [key, source[key]]),
  ) as UpdateBlueprintPatch

  if (Object.keys(patch).length === 0) {
    throw new ValidationError(`body must contain at least one of: ${PATCH_KEYS.join(", ")}`)
  }

  return ok(await blueprintService.update(id, patch))
})

export const DELETE = withErrorHandling(async (_request: Request, context: RouteParams) => {
  const id = await parseId(context)
  await blueprintService.deleteBlueprint(id)
  return ok({ id })
})
