import { AppShell } from "@/components/app-shell"
import { SECTIONS, sectionStatus } from "@/lib/blueprint/registry"
import { listBlueprints } from "@/lib/blueprints"

// The sidebar lists Blueprints straight from SQLite; never serve it from a build-time snapshot.
export const dynamic = "force-dynamic"

// Every screen of the app renders inside the shell. A route that must render without it
// (the presentation view of a Blueprint) lives outside this group.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const blueprints = listBlueprints().map((blueprint) => ({
    id: blueprint.id,
    name: blueprint.name,
    sections: SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      firstQuestion: section.questions[0],
      status: sectionStatus(blueprint.data, section),
    })),
  }))

  return <AppShell blueprints={blueprints}>{children}</AppShell>
}
