import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/useMobile";
import {
  adminNavigationGroups,
  isAdminRouteActive,
} from "@/const/admin-navigation";
import { ArrowLeftRight, LogOut, ShieldCheck } from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useLocation } from "wouter";

export default function AdminShell({ children }: { children: ReactNode }) {
  const sidebarWidth = 320;

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <AdminShellContent>{children}</AdminShellContent>
    </SidebarProvider>
  );
}

function AdminShellContent({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const [mobileOpenLabel, setMobileOpenLabel] = useState("Menu");

  const activeItem = useMemo(
    () =>
      adminNavigationGroups
        .flatMap(group => group.items)
        .find(item => isAdminRouteActive(location, item.href)),
    [location]
  );

  const navigate = (href: string, label: string) => {
    setMobileOpenLabel(label);
    if (isMobile) setOpenMobile(false);
    setLocation(href);
  };

  return (
    <>
      <Sidebar
        collapsible={isMobile ? "offcanvas" : "none"}
        className="border-r bg-sidebar"
      >
        <SidebarHeader className="border-b px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                Paeds Resus
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                Global Admin
              </p>
            </div>
            {isMobile ? (
              <SidebarTrigger
                className="ml-auto h-9 w-9 shrink-0 rounded-lg"
                aria-label="Hide admin navigation"
                title="Hide admin navigation"
              />
            ) : null}
          </div>
        </SidebarHeader>

        <SidebarContent className={`py-2 ${isMobile ? "gap-3" : "gap-0"}`}>
          {adminNavigationGroups.map(group => {
            const GroupIcon = group.icon;
            return (
              <SidebarGroup
                key={group.label}
                className={`px-2 ${isMobile ? "gap-1 py-2" : "py-1"}`}
              >
                <SidebarGroupLabel
                  className={`min-w-0 gap-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60 ${isMobile ? "h-auto min-h-8 items-start py-1 leading-5" : "overflow-hidden leading-4"}`}
                >
                  <GroupIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span
                    className={`min-w-0 ${isMobile ? "whitespace-normal break-words leading-5" : "truncate"}`}
                  >
                    {group.label}
                  </span>
                </SidebarGroupLabel>
                <SidebarGroupContent className={isMobile ? "mt-1" : undefined}>
                  <SidebarMenu className={isMobile ? "gap-2" : undefined}>
                    {group.items.map(item => {
                      const ItemIcon = item.icon;
                      const isActive = isAdminRouteActive(location, item.href);
                      return (
                        <SidebarMenuItem
                          key={item.href}
                          className={isMobile ? "pb-1" : undefined}
                        >
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => navigate(item.href, item.label)}
                            tooltip={item.label}
                            className={`min-w-0 overflow-hidden font-normal ${isMobile ? "h-auto min-h-10 items-start py-2" : "h-10"} ${item.badge ? "pr-12" : ""}`}
                          >
                            <ItemIcon className="mt-0.5 h-4 w-4 shrink-0" />
                            <span
                              className={`min-w-0 flex-1 ${isMobile ? "!overflow-visible !text-clip !whitespace-normal break-words leading-5" : "truncate"}`}
                            >
                              {item.label}
                            </span>
                          </SidebarMenuButton>
                          {item.badge ? (
                            <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                          ) : null}
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        <SidebarSeparator />
        <SidebarFooter className="gap-2 p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/institution", "Institution Workspace")}
            className="w-full justify-start gap-2 bg-sidebar"
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            <span>Switch workspace</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                  <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-foreground">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user?.name || "Global administrator"}
                  </p>
                  <p className="truncate text-xs text-sidebar-foreground/70">
                    {user?.email || "Admin account"}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {isMobile ? (
          <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SidebarTrigger
              className="h-9 w-9 rounded-lg"
              aria-label="Open admin navigation"
              title="Open admin navigation"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {activeItem?.label || mobileOpenLabel}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Global Admin
              </p>
            </div>
          </div>
        ) : null}
        <main id="main-content" className="min-h-svh bg-muted/20 p-4 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
