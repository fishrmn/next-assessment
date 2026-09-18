"use client"

import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  LayoutGridIcon,
  PlusIcon,
  SwatchBookIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { NewBlueprintDialog } from "@/components/new-blueprint-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { isQuestionId, sectionOf, type SectionStatus } from "@/lib/blueprint/registry"

/** What the sidebar needs per Blueprint. Computed on the server by the layout. */
export type SidebarBlueprint = {
  id: number
  name: string
  sections: { id: string; title: string; firstQuestion: string; status: SectionStatus }[]
}

const statusIcon = {
  done: CircleCheckIcon,
  partial: CircleDashedIcon,
  empty: CircleIcon,
} as const

const statusLabel = { done: "complete", partial: "in progress", empty: "not started" } as const

/**
 * The app's sidebar, following shadcn's documented anatomy: a header with the logo box and a
 * two-line text block, then one group listing every saved Blueprint. The open Blueprint expands
 * to its intake sections, each with its progress, so the session guides without trapping.
 */
export function AppSidebar({ blueprints }: { blueprints: SidebarBlueprint[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const question = searchParams.get("q")
  // While the inspect tool is open the person is not on any intake section.
  const activeSection = searchParams.has("inspect")
    ? null
    : isQuestionId(question)
      ? sectionOf(question).id
      : "basics"

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <SwatchBookIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Brand Blueprint</span>
                <span className="truncate text-xs">Builder</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/"}
                  tooltip="All blueprints"
                  render={<Link href="/" />}
                >
                  <LayoutGridIcon />
                  <span>All blueprints</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Blueprints</SidebarGroupLabel>
          <NewBlueprintDialog
            trigger={
              <SidebarGroupAction title="New blueprint">
                <PlusIcon />
                <span className="sr-only">New blueprint</span>
              </SidebarGroupAction>
            }
          />
          <SidebarGroupContent>
            <SidebarMenu>
              {blueprints.map((blueprint) => {
                const href = `/blueprints/${blueprint.id}`
                const open = pathname === href
                return (
                  <SidebarMenuItem key={blueprint.id}>
                    <SidebarMenuButton
                      isActive={open}
                      tooltip={blueprint.name}
                      render={<Link href={href} />}
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-sidebar-accent text-[0.625rem] font-semibold uppercase">
                        {blueprint.name.charAt(0)}
                      </span>
                      <span>{blueprint.name}</span>
                    </SidebarMenuButton>
                    {open && (
                      <SidebarMenuSub>
                        {blueprint.sections.map((section) => {
                          const StatusIcon = statusIcon[section.status]
                          return (
                            <SidebarMenuSubItem key={section.id}>
                              <SidebarMenuSubButton
                                isActive={section.id === activeSection}
                                render={<Link href={`${href}?q=${section.firstQuestion}`} />}
                              >
                                <StatusIcon
                                  aria-label={statusLabel[section.status]}
                                  className={
                                    section.status === "empty" ? "opacity-40" : undefined
                                  }
                                />
                                <span>{section.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
