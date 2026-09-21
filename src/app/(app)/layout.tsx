import { AppShell } from "@/components/app-shell"
import { countUpdates, statusOf } from "@/lib/blueprint/fields"
import { listBlueprints } from "@/lib/blueprints"

// The sidebar lists Blueprints straight from SQLite; never serve it from a build-time snapshot.
export const dynamic = "force-dynamic"

// Every screen of the app renders inside the shell. A route that must render without it
// (the presentation view of a Blueprint) lives outside this group.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const blueprints = listBlueprints().map((blueprint) => ({
    id: blueprint.id,
    name: blueprint.name,
    reviewed: statusOf(blueprint.data, countUpdates(blueprint.messages)) === "Reviewed with you",
  }))

  return <AppShell blueprints={blueprints}>{children}</AppShell>
}
