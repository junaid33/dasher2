import { fetchGraphQL } from "@/lib/graphql"
import { DashboardUI } from "@/components/dashboard-ui"

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Fetch lists from the GraphQL API - same query as in dashboard page
  const data = await fetchGraphQL(`
    query {
      keystone {
        adminMeta {
          lists {
            key
            path
            label
            singular
            plural
          }
        }
      }
    }
  `)

  const lists = data.keystone.adminMeta.lists
  
  // Transform the lists data to match the expected format for sidebarLinks
  const sidebarLinks = lists.map((list: any) => ({
    title: list.label,
    href: `/${list.path}`
  }));

  return (
    <DashboardUI sidebarLinks={sidebarLinks}>
      {children}
    </DashboardUI>
  );
}