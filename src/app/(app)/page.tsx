import { PlusIcon, SwatchBookIcon } from "lucide-react"
import Link from "next/link"

import { createBlueprint } from "@/actions/blueprints"
import { DeleteBlueprint } from "@/components/delete-blueprint"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { completion } from "@/lib/blueprint/fields"
import { listBlueprints } from "@/lib/blueprints"

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" })

export default function BlueprintsPage() {
  const blueprints = listBlueprints()
  // No dialog: the button creates the Blueprint and opens its chat, where the agent asks the rest.
  const newBlueprint = (
    <form action={createBlueprint}>
      <Button type="submit">
        <PlusIcon />
        New blueprint
      </Button>
    </form>
  )

  return (
    <>
      <PageHeader
        title="Blueprints"
        description="One per client. Open one and tell the agent what to capture or change."
        actions={newBlueprint}
      />
      {blueprints.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SwatchBookIcon />
            </EmptyMedia>
            <EmptyTitle>No blueprints yet</EmptyTitle>
            <EmptyDescription>
              Create one and describe the brand to the agent. It fills in the rest.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newBlueprint}</EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {blueprints.map((blueprint) => {
            const percent = completion(blueprint.data)
            const palette = blueprint.data.expression.color.palette
            return (
              <li key={blueprint.id}>
                <Card className="relative h-full transition-[box-shadow] duration-150 hover:shadow-md has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
                  <CardHeader>
                    <CardTitle className="max-w-full wrap-anywhere">
                      <Link
                        href={`/blueprints/${blueprint.id}`}
                        className="outline-none after:absolute after:inset-0"
                      >
                        {blueprint.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {blueprint.data.business.industry || "Industry not set"} · Updated{" "}
                      {dateFormat.format(blueprint.updatedAt)}
                    </CardDescription>
                    {/* The whole card is a link (the title's ::after covers it); `z-10` lifts this button above it. */}
                    <CardAction className="relative z-10">
                      <DeleteBlueprint id={blueprint.id} name={blueprint.name} from="list" />
                    </CardAction>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-col gap-3">
                    <div className="flex h-2 gap-1">
                      {palette ? (
                        [palette.primary, palette.secondary, palette.accent].map((hex) => (
                          <span
                            key={hex}
                            className="flex-1 rounded-full"
                            style={{ backgroundColor: hex }}
                          />
                        ))
                      ) : (
                        <span className="flex-1 rounded-full border border-dashed" />
                      )}
                    </div>
                    <Progress value={percent} aria-label="Captured" />
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {percent}% captured
                    </p>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
