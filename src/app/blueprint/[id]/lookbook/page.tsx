import { notFound } from "next/navigation"

import { Lookbook } from "@/components/lookbook/Lookbook"
import { NotFoundError } from "@/lib/errors"
import { blueprintService } from "@/services/blueprint-service"

/**
 * The presentable spread of a saved Blueprint. `params` is a Promise in this
 * version of Next — same server-component shape as the editor route next door,
 * and deliberately logic-free: it loads and delegates.
 */
export default async function LookbookPage({
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

  return <Lookbook blueprint={blueprint} />
}
