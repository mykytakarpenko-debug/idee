import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirePermission } from "@/components/panel/panel-shell";
import { TicketDetailView } from "@/features/tickets/ticket-detail-view";

export const metadata: Metadata = { title: "Ticket" };

async function TicketContent({
  params,
}: {
  params: PageProps<"/portale/assistenza/[id]">["params"];
}) {
  const { id } = await params;
  return <TicketDetailView ticketId={decodeURIComponent(id)} area="portal" />;
}

export default function PortalTicketPage({ params }: PageProps<"/portale/assistenza/[id]">) {
  return (
    <RequirePermission permission="tickets.view">
      <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
        <TicketContent params={params} />
      </Suspense>
    </RequirePermission>
  );
}
