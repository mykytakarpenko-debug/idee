import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { ClientsView } from "@/features/admin/clients-view";

export const metadata: Metadata = { title: "Clienti" };

export default function AdminClientiPage() {
  return (
    <RequirePermission permission="clients.manage">
      <ClientsView />
    </RequirePermission>
  );
}
