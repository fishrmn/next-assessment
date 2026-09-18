import { notFound } from "next/navigation"

import { BlueprintCanvas } from "@/components/canvas/BlueprintCanvas"
import { NotFoundError } from "@/lib/errors"
import { blueprintService } from "@/services/blueprint-service"

export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const blueprintId = Number.parseInt(id, 10)
  if (Number.isNaN(blueprintId)) notFound()

  let blueprint
  try {
    blueprint = await blueprintService.getById(blueprintId)
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    throw error
  }

  return <BlueprintCanvas blueprint={blueprint} />
}
