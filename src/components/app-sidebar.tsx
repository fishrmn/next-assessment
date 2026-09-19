"use client"

import { LayoutGridIcon, PlusIcon, SwatchBookIcon } from "lucide-react"
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
export type SidebarBlueprint = { id: number; name: string; percent: number }

/**
 * The app's sidebar, following shadcn's documented anatomy: a header with the logo box and a
 * two-line text block, then one group listing every saved Blueprint with how much of it is
 * captured. "New blueprint" is a plain form: it creates the row and opens its chat.
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
                    <SidebarMenuBadge className="tabular-nums">{blueprint.percent}%</SidebarMenuBadge>
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
