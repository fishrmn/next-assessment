"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { SidebarBlueprint } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/**
 * Where the person is, derived from the URL. Inside a workspace the last crumb is the brand's
 * name, not its id. On narrow screens only the current crumb shows.
 */
export function AppBreadcrumb({ blueprints }: { blueprints: SidebarBlueprint[] }) {
  const match = usePathname().match(/^\/blueprints\/(\d+)/)
  const current = match ? blueprints.find((item) => item.id === Number(match[1])) : null

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {current ? (
          <>
            <BreadcrumbItem className="hidden md:inline-flex">
              <BreadcrumbLink render={<Link href="/" />}>Blueprints</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{current.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>Blueprints</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
