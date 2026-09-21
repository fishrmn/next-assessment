import { CompassIcon } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
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
 * Any URL the app does not know, and a presentation link to a Blueprint that is gone. It renders
 * outside the shell (no sidebar), so it carries its own way back.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CompassIcon />
          </EmptyMedia>
          <EmptyTitle>There&apos;s nothing at this address</EmptyTitle>
          <EmptyDescription>
            The page may have moved, or the blueprint it showed may have been deleted.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/" className={cn(buttonVariants())}>
            Go to your blueprints
          </Link>
        </EmptyContent>
      </Empty>
    </main>
  )
}
