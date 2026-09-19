import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { AppSidebar, type SidebarBlueprint } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

/**
 * Dashboard shell, after shadcn's sidebar blocks: sidebar on the left; a header with the sidebar
 * toggle, the breadcrumb (where the person is) and the theme toggle; content below.
 * The header is `--header-height`; a screen that sizes itself against the viewport reads that
 * variable instead of a number. A screen's own actions belong in its PageHeader, not here.
 */
export function AppShell({
  blueprints,
  children,
}: {
  blueprints: SidebarBlueprint[]
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <SidebarProvider style={{ "--header-height": "3.5rem" } as React.CSSProperties}>
        <AppSidebar blueprints={blueprints} />
        <SidebarInset className="min-w-0">
          <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <AppBreadcrumb blueprints={blueprints} />
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
