import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { deleteBlueprint } from "@/actions/blueprints"

import { DeleteBlueprint } from "./delete-blueprint"

// The real action opens the SQLite file and needs Next's runtime. Here only the control is tested.
vi.mock("@/actions/blueprints", () => ({
  deleteBlueprint: vi.fn(async () => ({ ok: true, message: "Blueprint deleted" })),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("DeleteBlueprint", () => {
  it("asks first, and deletes nothing when the person cancels", async () => {
    render(<DeleteBlueprint id={7} name="Patio" from="list" />)

    fireEvent.click(screen.getByRole("button", { name: "Delete Patio" }))
    expect(await screen.findByText("Delete “Patio”?")).toBeDefined()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(deleteBlueprint).not.toHaveBeenCalled()
  })

  it("deletes that Blueprint once the person confirms", async () => {
    render(<DeleteBlueprint id={7} name="Patio" from="list" />)

    fireEvent.click(screen.getByRole("button", { name: "Delete Patio" }))
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleteBlueprint).toHaveBeenCalledWith(7, "list"))
  })
})
