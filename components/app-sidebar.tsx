"use client";

import * as React from "react";
import {
  ChevronRight,
  LayoutDashboard,
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
  Home,
  LogOut,
  Moon,
  Sun,
  Monitor
} from "lucide-react";

import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "next-themes";

// Use a placeholder logo component
function Logo() {
  return (
    <div className="flex items-center gap-2 text-xl font-bold text-primary">
      <div className="h-6 w-6 rounded-md bg-primary text-white flex items-center justify-center text-sm">
        D
      </div>
      <span>Dasher</span>
    </div>
  );
}

// Use a placeholder logo icon component
function LogoIcon() {
  return (
    <div className="h-6 w-6 rounded-md bg-primary text-white flex items-center justify-center text-sm">
      D
    </div>
  );
}

// Theme toggle component
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex w-full items-center justify-between px-2 py-1.5">
      <span className="text-sm">Theme</span>
      <fieldset className="flex h-5 items-center rounded-md border bg-muted p-0.5 gap-0.5">
        <legend className="sr-only">Select a display theme:</legend>
        {[
          { value: "system", icon: Monitor },
          { value: "light", icon: Sun },
          { value: "dark", icon: Moon },
        ].map(({ value, icon: Icon }) => (
          <label
            key={value}
            className={`relative flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm text-sm transition-colors hover:bg-background ${
              theme === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={(e) => setTheme(e.target.value)}
              className="absolute inset-0 opacity-0"
              aria-label={value}
            />
            <Icon className="h-3 w-3" />
          </label>
        ))}
      </fieldset>
    </div>
  );
}

// User navigation component
function NavUser() {
  const { isMobile } = useSidebar();
  
  // Mock user data
  const user = {
    name: "Demo User",
    email: "demo@example.com",
    id: "1",
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-background border shadow-sm data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronRight className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <Link 
                  href={`/users/${user.id}`}
                  className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ThemeToggle />
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

interface AppSidebarProps {
  sidebarLinks: Array<{ title: string; href: string }>;
}

export function AppSidebar({ sidebarLinks = [] }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const dashboardItem = {
    title: "Dashboard",
    items: sidebarLinks,
    isActive: true,
    icon: LayoutDashboard,
  };

  // Main navigation items
  const mainNavItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenuButton asChild>
          <div className="group-has-[[data-collapsible=icon]]/sidebar-wrapper:hidden p-2">
            <Logo />
          </div>
        </SidebarMenuButton>
        <SidebarMenuButton asChild>
          <div className="hidden group-has-[[data-collapsible=icon]]/sidebar-wrapper:block p-2">
            <LogoIcon />
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="no-scrollbar">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map((route) => (
              <SidebarMenuItem key={route.url}>
                <SidebarMenuButton asChild>
                  <Link href={route.url} onClick={() => setOpenMobile(false)}>
                    {route.icon && <route.icon className="h-4 w-4 stroke-2" />}
                    <span>{route.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Dashboard Links - Collapsible/Dropdown */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <div className="max-h-full overflow-y-auto group-has-[[data-collapsible=icon]]/sidebar-wrapper:hidden">
            <Collapsible
              key={dashboardItem.title}
              asChild
              defaultOpen={dashboardItem.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <dashboardItem.icon className="h-4 w-4" />
                    <span>{dashboardItem.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {dashboardItem.items.map((link) => (
                      <SidebarMenuSubItem key={link.href}>
                        <SidebarMenuSubButton asChild>
                          <Link href={link.href} onClick={() => setOpenMobile(false)}>
                            <span>{link.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </div>

          <div className="hidden group-has-[[data-collapsible=icon]]/sidebar-wrapper:block">
            <DropdownMenu>
              <SidebarMenuItem>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <dashboardItem.icon className="h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                  className="min-w-56"
                >
                  <div className="max-h-[calc(100vh-16rem)] overflow-y-auto py-1">
                    {dashboardItem.items.map((link) => (
                      <DropdownMenuItem asChild key={link.href}>
                        <Link href={link.href} onClick={() => setOpenMobile(false)}>
                          <span>{link.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </SidebarMenuItem>
            </DropdownMenu>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/api/graphql" target="_blank" rel="noopener noreferrer">
                <div className="text-fuchsia-500">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.125 6.45c0-.224.12-.431.315-.542l6.25-3.572a.625.625 0 0 1 .62 0l6.25 3.572a.625.625 0 0 1 .315.542v7.099c0 .224-.12.431-.315.542l-6.25 3.572a.625.625 0 0 1-.62 0L3.44 14.09a.625.625 0 0 1-.315-.542V6.45ZM1.25 13.55a2.5 2.5 0 0 0 1.26 2.17l6.25 3.572a2.5 2.5 0 0 0 2.48 0l6.25-3.572a2.5 2.5 0 0 0 1.26-2.17V6.45a2.5 2.5 0 0 0-1.26-2.17L11.24.708a2.5 2.5 0 0 0-2.48 0L2.51 4.28a2.5 2.5 0 0 0-1.26 2.17v7.099Z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="m10 .338-8.522 14.35h17.044L10 .337ZM4.772 12.812 10 4.01l5.228 8.802H4.772Z" />
                  </svg>
                </div>
                <span>GraphQL Playground</span>
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/changelog" target="_blank" rel="noopener noreferrer">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span>Changelog</span>
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
} 