import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { AuditView } from "@/features/admin/audit-view";

export const metadata: Metadata = { title: "Registro attività" };

export default function AdminRegistroPage() {
  return (
    <RequirePermission permission="audit.view">
      <AuditView />
    </RequirePermission>
  );
}
