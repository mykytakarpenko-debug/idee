import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { SecurityView } from "@/features/portal/security-view";

export const metadata: Metadata = { title: "Sicurezza" };

export default function PortaleSicurezzaPage() {
  return (
    <RequirePermission permission="portal.access">
      <SecurityView />
    </RequirePermission>
  );
}
