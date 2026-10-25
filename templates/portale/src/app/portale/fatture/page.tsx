import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { InvoicesView } from "@/features/portal/invoices-view";

export const metadata: Metadata = { title: "Fatture" };

export default function PortaleFatturePage() {
  return (
    <RequirePermission permission="invoices.view">
      <InvoicesView />
    </RequirePermission>
  );
}
