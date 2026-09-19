import { notFound } from "next/navigation"
import { loadChat } from "@/agents/blueprint-history"
import { Workspace } from "@/components/blueprint/workspace"
import { getBlueprint } from "@/lib/blueprints"

export default async function BlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const blueprint = getBlueprint(Number(id))
  if (!blueprint) notFound()

  return (
    // `key` gives each Blueprint its own workspace state when switching in the sidebar.
    <Workspace
      key={blueprint.id}
      id={blueprint.id}
      initial={blueprint.data}
      initialMessages={await loadChat(blueprint.messages, blueprint.data)}
    />
  )
}
