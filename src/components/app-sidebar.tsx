"use client"

import { CheckIcon, LayoutGridIcon, PlusIcon, SwatchBookIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { createBlueprint } from "@/actions/blueprints"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

/** What the sidebar needs per Blueprint. Computed on the server by the layout. */
export type SidebarBlueprint = { id: number; name: string; reviewed: boolean }

/**
 * The app's sidebar, following shadcn's documented anatomy: a header with the logo box and a
 * two-line text block, then one group listing every saved Blueprint, with a check on the ones
 * the client has confirmed. "New blueprint" is a plain form: it creates the row and opens its chat.
 */
export function AppSidebar({ blueprints }: { blueprints: SidebarBlueprint[] }) {
  const pathname = usePathname()

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
          <form action={createBlueprint}>
            <SidebarGroupAction type="submit" title="New blueprint">
              <PlusIcon />
              <span className="sr-only">New blueprint</span>
            </SidebarGroupAction>
          </form>
          <SidebarGroupContent>
            <SidebarMenu>
              {blueprints.map((blueprint) => {
                const href = `/blueprints/${blueprint.id}`
                return (
                  <SidebarMenuItem key={blueprint.id}>
                    <SidebarMenuButton
                      isActive={pathname === href}
                      tooltip={blueprint.name}
                      render={<Link href={href} />}
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-sidebar-accent text-[0.625rem] font-semibold uppercase">
                        {blueprint.name.charAt(0)}
                      </span>
                      <span>{blueprint.name}</span>
                    </SidebarMenuButton>
                    {blueprint.reviewed && (
                      <SidebarMenuBadge>
                        <CheckIcon className="size-3.5" aria-label="Reviewed with the client" />
                      </SidebarMenuBadge>
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
