import type { Metadata } from "next";
import { copy } from "@/content/it";
import { ReportsView } from "@/features/reports/reports-view";

export const metadata: Metadata = { title: copy.reports.title };

export default function ReportsPage() {
  return <ReportsView />;
}
