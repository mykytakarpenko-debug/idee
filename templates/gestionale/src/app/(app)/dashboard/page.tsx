import type { Metadata } from "next";
import { copy } from "@/content/it";
import { DashboardView } from "@/features/dashboard/dashboard-view";

export const metadata: Metadata = { title: copy.dashboard.title };

export default function DashboardPage() {
  return <DashboardView />;
}
