import type { Metadata } from "next";
import { copy } from "@/content/it";
import { DashboardView } from "@/features/panel/dashboard-view";

export const metadata: Metadata = { title: copy.panel.nav.dashboard };

export default function Page() {
  return <DashboardView />;
}
