"use client"

import { Trash2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { deleteBlueprint } from "@/actions/blueprints"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/**
 * The delete control for one Blueprint: a trash button that asks before it acts, because a
 * deleted Blueprint and its conversation cannot be brought back.
 * `from` says where it sits: in the Blueprint's workspace (then the person lands on the list)
 * or on the list itself (then the list refreshes and a toast confirms).
 */
export function DeleteBlueprint({
  id,
  name,
  from,
  className,
}: {
  id: number
  name: string
  from: "workspace" | "list"
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirm() {
    startTransition(async () => {
      const result = await deleteBlueprint(id, from)
      // From the workspace the action redirects and never returns here.
      if (result.ok) toast.success(`Deleted “${name}”`)
      else toast.error(result.message)
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${name}`}
            className={cn("text-muted-foreground hover:text-destructive", className)}
          />
        }
      >
        <Trash2Icon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="max-w-full wrap-anywhere">Delete “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The blueprint and its conversation will be deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={confirm}>
            {pending && <Spinner />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
