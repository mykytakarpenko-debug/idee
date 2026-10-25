import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { RolesView } from "@/features/admin/roles-view";

export const metadata: Metadata = { title: "Ruoli" };

export default function AdminRuoliPage() {
  return (
    <RequirePermission permission="users.manage">
      <RolesView />
    </RequirePermission>
  );
}
