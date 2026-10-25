import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { UsersView } from "@/features/users/users-view";

export const metadata: Metadata = { title: "Utenti" };

export default function AdminUtentiPage() {
  return (
    <RequirePermission permission="users.manage">
      <UsersView area="admin" />
    </RequirePermission>
  );
}
