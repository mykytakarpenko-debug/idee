import type { Metadata } from "next";
import { copy } from "@/content/it";
import { DashboardView } from "@/features/panel/dashboard-view";

export const metadata: Metadata = {
  title: copy.panel.dashboard.title,
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardView />;
}
