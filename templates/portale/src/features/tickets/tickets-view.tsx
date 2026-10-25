"use client";

import { LifeBuoy, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { can } from "@/lib/domain/rbac";
import { isOpenStatus, queueOrder, slaState } from "@/lib/domain/tickets";
import type { Ticket } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { PriorityBadge, SlaBadge, TicketStatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { NewTicketDialog } from "./new-ticket-dialog";

const t = copy.tickets;
const PAGE_SIZE = 12;

type PortalFilter = "open" | "closed" | "all";
type AdminFilter = "open" | "mine" | "unassigned" | "all";

function matches(ticket: Ticket, q: string) {
  return !q || `${ticket.number} ${ticket.subject}`.toLowerCase().includes(q);
}

/** Elenco ticket: nel portale quelli dell'azienda, nell'area admin la coda completa. */
export function TicketsView({ area }: { area: "portal" | "admin" }) {
  const now = useNow();
  const { user, org } = useAuth();
  const { tickets, organizations, users, slaHours } = useData((state) => ({
    tickets: state.tickets,
    organizations: state.organizations,
    users: state.users,
    slaHours: state.settings.slaHours,
  }));
  const [filter, setFilter] = useState<PortalFilter | AdminFilter>("open");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const admin = area === "admin";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = admin ? tickets : tickets.filter((ticket) => ticket.orgId === org?.id);
    const filtered = scoped.filter((ticket) => {
      if (!matches(ticket, q)) return false;
      switch (filter) {
        case "open":
          return isOpenStatus(ticket.status);
        case "closed":
          return !isOpenStatus(ticket.status);
        case "mine":
          return isOpenStatus(ticket.status) && ticket.assigneeId === user?.id;
        case "unassigned":
          return isOpenStatus(ticket.status) && ticket.assigneeId === null;
        default:
          return true;
      }
    });
    return admin && now
      ? queueOrder(filtered, slaHours, now)
      : filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tickets, org?.id, admin, filter, query, user?.id, slaHours, now]);

  if (!user) return null;
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const orgName = (id: string) => organizations.find((o) => o.id === id)?.name ?? "—";
  const userName = (id: string | null) =>
    id ? (users.find((u) => u.id === id)?.name ?? "—") : t.unassigned;
  const filters = admin
    ? (["open", "mine", "unassigned", "all"] as const)
    : (["open", "closed", "all"] as const);

  return (
    <Page>
      <PageHeader
        title={admin ? t.adminTitle : t.title}
        description={admin ? t.adminDescription : t.description}
        actions={
          !admin && can(user.role, "tickets.create") ? (
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              {t.new}
            </Button>
          ) : null
        }
      />
      <Toolbar>
        <SegmentedControl
          ariaLabel={t.title}
          value={filter}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          options={filters.map((value) => ({ value, label: t.filters[value] }))}
          className="max-w-full overflow-x-auto"
        />
        <SearchInput
          label={t.search}
          placeholder={t.search}
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
      </Toolbar>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={LifeBuoy} title={t.empty} />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>{t.columns.subject}</TH>
                  {admin ? <TH className="hidden md:table-cell">{t.columns.client}</TH> : null}
                  <TH className="hidden sm:table-cell">{t.columns.priority}</TH>
                  {admin ? <TH className="hidden lg:table-cell">{t.columns.sla}</TH> : null}
                  <TH>{t.columns.status}</TH>
                  {admin ? <TH className="hidden xl:table-cell">{t.columns.assignee}</TH> : null}
                  <TH align="right" className="hidden md:table-cell">
                    {t.columns.updated}
                  </TH>
                </TR>
              </THead>
              <TBody>
                {pageRows.map((ticket) => (
                  <TR key={ticket.id} className="hover:bg-surface-2">
                    <TD className="min-w-48">
                      <Link
                        href={admin ? routes.adminTicket(ticket.id) : routes.ticket(ticket.id)}
                        className="font-medium text-fg hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                      <p className="text-[13px] text-fg-muted">
                        {ticket.number} · {copy.ticketCategory[ticket.category]}
                      </p>
                    </TD>
                    {admin ? (
                      <TD className="hidden text-fg-muted md:table-cell">
                        {orgName(ticket.orgId)}
                      </TD>
                    ) : null}
                    <TD className="hidden sm:table-cell">
                      <PriorityBadge value={ticket.priority} />
                    </TD>
                    {admin ? (
                      <TD className="hidden lg:table-cell">
                        {now ? <SlaBadge value={slaState(ticket, slaHours, now)} /> : null}
                      </TD>
                    ) : null}
                    <TD>
                      <TicketStatusBadge value={ticket.status} />
                    </TD>
                    {admin ? (
                      <TD className="hidden text-fg-muted xl:table-cell">
                        {userName(ticket.assigneeId)}
                      </TD>
                    ) : null}
                    <TD align="right" className="hidden text-fg-muted md:table-cell">
                      {formatDate(ticket.updatedAt, "short")}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
      <Dialog open={creating} onOpenChange={setCreating}>
        {creating ? <NewTicketDialog onDone={() => setCreating(false)} /> : null}
      </Dialog>
    </Page>
  );
}
