import { DashboardUI } from "@/components/dashboard-ui"
import { getAdminMeta } from "@/lib/hooks/getAdminMeta"

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Use our cached admin metadata function
  const adminMeta = await getAdminMeta();
  
  // Transform the lists data to match the expected format for sidebarLinks
  const sidebarLinks = Object.values(adminMeta.lists).map((list) => ({
    title: list.label,
    href: `/${list.path}`
  }));

  return (
    <DashboardUI sidebarLinks={sidebarLinks}>
      {children}
    </DashboardUI>
  );
}