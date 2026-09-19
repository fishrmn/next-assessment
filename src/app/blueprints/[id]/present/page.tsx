import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { BlueprintDocument } from "@/components/blueprint/blueprint-document"
import { buttonVariants } from "@/components/ui/button"
import { getBlueprint } from "@/lib/blueprints"
import { cn } from "@/lib/utils"

// Read from SQLite on every request; never a build-time snapshot.
export const dynamic = "force-dynamic"

/**
 * Full-screen view of a Blueprint, for presenting and for handing off as a link.
 * It lives outside the `(app)` group on purpose: no sidebar, no header, just the page.
 */
export default async function PresentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const blueprint = getBlueprint(Number(id))
  if (!blueprint) notFound()

  return (
    <main className="flex flex-1 flex-col items-center gap-4 bg-muted/40 p-4 md:p-8 print:bg-transparent print:p-0">
      <div className="flex w-full max-w-5xl print:hidden">
        <Link
          href={`/blueprints/${blueprint.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeftIcon />
          Back to session
        </Link>
      </div>
      <BlueprintDocument blueprint={blueprint.data} className="w-full max-w-5xl" />
    </main>
  )
}
