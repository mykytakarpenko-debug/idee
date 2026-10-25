import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { TicketsView } from "@/features/tickets/tickets-view";

export const metadata: Metadata = { title: "Assistenza" };

export default function PortaleAssistenzaPage() {
  return (
    <RequirePermission permission="tickets.view">
      <TicketsView area="portal" />
    </RequirePermission>
  );
}
