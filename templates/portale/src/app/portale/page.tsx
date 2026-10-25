import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { OverviewView } from "@/features/portal/overview-view";

export const metadata: Metadata = { title: "Panoramica" };

export default function PortalePage() {
  return (
    <RequirePermission permission="portal.access">
      <OverviewView />
    </RequirePermission>
  );
}
