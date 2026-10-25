import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { TicketsView } from "@/features/tickets/tickets-view";

export const metadata: Metadata = { title: "Ticket" };

export default function AdminTicketPage() {
  return (
    <RequirePermission permission="tickets.manage">
      <TicketsView area="admin" />
    </RequirePermission>
  );
}
