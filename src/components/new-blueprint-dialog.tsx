"use client"

import { useActionState, useState } from "react"

import { createBlueprint } from "@/actions/blueprints"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { initialFormState } from "@/lib/form-state"

/**
 * Create flow for a Blueprint: a dialog opened from a CTA, never a form embedded in a page.
 * `trigger` is the element that opens it (a Button, a sidebar action). On success the server
 * action redirects to the new workspace, which is the confirmation.
 */
export function NewBlueprintDialog({ trigger }: { trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createBlueprint, initialFormState)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <form action={action} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>New blueprint</DialogTitle>
            <DialogDescription>
              Start with the brand&apos;s name. Everything else is captured in the guided session.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={Boolean(state.message) || undefined}>
              <FieldLabel htmlFor="blueprint-name">Brand name</FieldLabel>
              <Input
                id="blueprint-name"
                name="name"
                placeholder="Acme Payroll"
                autoComplete="off"
                maxLength={80}
                required
                autoFocus
              />
              {state.message && <FieldError>{state.message}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Start session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
