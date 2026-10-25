import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/panel/panel-shell";
import { TicketDetailView } from "@/features/tickets/ticket-detail-view";

export const metadata: Metadata = { title: "Ticket" };

async function TicketContent({ params }: { params: PageProps<"/admin/ticket/[id]">["params"] }) {
  const { id } = await params;
  return <TicketDetailView ticketId={decodeURIComponent(id)} area="admin" />;
}

export default function AdminTicketPage({ params }: PageProps<"/admin/ticket/[id]">) {
  return (
    <RequirePermission permission="tickets.manage">
      <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
        <TicketContent params={params} />
      </Suspense>
    </RequirePermission>
  );
}
