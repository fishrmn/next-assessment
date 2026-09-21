import { PlusIcon, SearchXIcon } from "lucide-react"
import Link from "next/link"

import { createBlueprint } from "@/actions/blueprints"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

/**
 * A Blueprint URL that leads nowhere: a deleted Blueprint, a mistyped id, or an old link.
 * It renders inside the shell, so the person still has the sidebar with every Blueprint that
 * does exist, and it offers the two things they most likely want next.
 */
export default function BlueprintNotFound() {
  return (
    <Empty className="flex-1 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>This blueprint doesn&apos;t exist</EmptyTitle>
        <EmptyDescription>
          It may have been deleted, or the link may be wrong. Your other blueprints are in the sidebar.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          All blueprints
        </Link>
        <form action={createBlueprint}>
          <Button type="submit">
            <PlusIcon />
            New blueprint
          </Button>
        </form>
      </EmptyContent>
    </Empty>
  )
}
