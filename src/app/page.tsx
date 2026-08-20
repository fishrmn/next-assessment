import { Eye, LayoutTemplate, Pencil, Plus, Scissors } from "lucide-react"
import Link from "next/link"

import { PageRenderer } from "@/components/builder/element-renderer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { listPages } from "@/db"
import { getTemplate } from "@/lib/templates"

export const dynamic = "force-dynamic"

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export default async function Home() {
  const pages = await listPages()

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2.5 px-6 py-3.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="size-4" aria-hidden />
          </div>
          <span className="font-heading font-semibold tracking-tight">
            Salon Builder
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-bold tracking-tight">Your pages</h1>
              {pages.length > 0 && (
                <Badge variant="secondary" className="tabular-nums">
                  {pages.length}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pick up where you left off, or start from a template.
            </p>
          </div>
          <Button render={<Link href="/builder/new" />}>
            <Plus data-icon="inline-start" />
            New page
          </Button>
        </div>

        {pages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <LayoutTemplate
                className="size-6 text-muted-foreground"
                aria-hidden
              />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-base font-medium">
                No pages yet
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Create your first salon page from one of three templates —
                every element stays fully editable.
              </p>
            </div>
            <Button render={<Link href="/builder/new" />}>
              <Plus data-icon="inline-start" />
              Create a page
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Card
                key={page.id}
                size="sm"
                className="gap-0 py-0 transition-shadow duration-200 [contain-intrinsic-size:auto_330px] [content-visibility:auto] hover:shadow-lg hover:ring-foreground/20"
              >
                <Link
                  href={`/builder/${page.id}`}
                  aria-label={`Edit ${page.name}`}
                  className="rounded-t-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none aspect-[16/10] select-none overflow-hidden rounded-t-xl border-b bg-muted"
                  >
                    <div className="h-[400%] w-[400%] origin-top-left scale-[0.25]">
                      <PageRenderer config={page.config} />
                    </div>
                  </div>
                </Link>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="truncate">{page.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {getTemplate(page.template)?.name ?? page.template}
                    </Badge>
                  </div>
                  <CardDescription className="tabular-nums">
                    Updated {dateFormat.format(new Date(page.updated_at))}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="gap-2">
                  <Button
                    size="sm"
                    render={<Link href={`/builder/${page.id}`} />}
                  >
                    <Pencil data-icon="inline-start" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={`/preview/${page.id}`} />}
                  >
                    <Eye data-icon="inline-start" />
                    Preview
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
