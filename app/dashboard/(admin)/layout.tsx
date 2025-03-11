import { DashboardLayout } from "@/components/dashboard-layout";

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}