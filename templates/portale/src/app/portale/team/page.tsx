import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { UsersView } from "@/features/users/users-view";

export const metadata: Metadata = { title: "Team" };

export default function PortaleTeamPage() {
  return (
    <RequirePermission permission="team.view">
      <UsersView area="portal" />
    </RequirePermission>
  );
}
