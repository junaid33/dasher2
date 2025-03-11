"use client";

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface DashboardUIProps {
  children: React.ReactNode;
  sidebarLinks?: Array<{ title: string; href: string }>;
}

export function DashboardUI({ children, sidebarLinks = [] }: DashboardUIProps) {
  return (
    <SidebarProvider>
      <AppSidebar sidebarLinks={sidebarLinks} />
      <SidebarInset className="min-w-0">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
} 