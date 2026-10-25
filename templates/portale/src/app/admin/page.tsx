import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { DashboardView } from "@/features/admin/dashboard-view";

export const metadata: Metadata = { title: "Panoramica" };

export default function AdminPage() {
  return (
    <RequirePermission permission="admin.access">
      <DashboardView />
    </RequirePermission>
  );
}
