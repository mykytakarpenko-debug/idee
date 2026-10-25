"use client";

import { FileText, FolderKanban, LifeBuoy, Mail, Receipt } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { lateMilestones, outstanding } from "@/lib/domain/billing";
import { parseISODate, toISODate } from "@/lib/domain/dates";
import { can } from "@/lib/domain/rbac";
import { isOpenStatus } from "@/lib/domain/tickets";
import { formatCurrency, formatDate } from "@/lib/format";
import { TicketStatusBadge } from "@/components/badges";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { StatCard } from "@/components/ui/stat-card";

const o = copy.overview;

export function OverviewView() {
  const now = useNow();
  const { user, org } = useAuth();
  const { projects, tickets, documents, invoices, users } = useData((state) => ({
    projects: state.projects,
    tickets: state.tickets,
    documents: state.documents,
    invoices: state.invoices,
    users: state.users,
  }));
  const orgId = org?.id ?? "";
  const today = now ? toISODate(now) : "";

  const view = useMemo(() => {
    const own = projects.filter((p) => p.orgId === orgId);
    const milestones = own
      .flatMap((p) => p.milestones.filter((m) => !m.done).map((m) => ({ ...m, project: p.name })))
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 5);
    return {
      activeProjects: own.filter((p) => p.status === "active").length,
      openTickets: tickets.filter((t) => t.orgId === orgId && isOpenStatus(t.status)).length,
      recentTickets: tickets
        .filter((t) => t.orgId === orgId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recentDocuments: documents
        .filter((d) => d.orgId === orgId)
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
        .slice(0, 5),
      money: today
        ? outstanding(
            invoices.filter((i) => i.orgId === orgId),
            today,
          )
        : { due: 0, overdue: 0 },
      milestones,
    };
  }, [projects, tickets, documents, invoices, orgId, today]);

  if (!user || !org) return null;
  const manager = users.find((u) => u.id === org.accountManagerId);
  const showInvoices = can(user.role, "invoices.view");

  return (
    <Page>
      <PageHeader
        title={o.greeting(user.name.split(" ")[0] ?? user.name)}
        description={o.subtitle(org.name)}
      />

      <section
        aria-label={o.subtitle(org.name)}
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3"
      >
        <StatCard label={o.kpi.projects} value={view.activeProjects} icon={<FolderKanban />} />
        <StatCard label={o.kpi.tickets} value={view.openTickets} icon={<LifeBuoy />} />
        {showInvoices ? (
          <StatCard
            label={o.kpi.invoices}
            value={formatCurrency(view.money.due + view.money.overdue)}
            hint={
              view.money.overdue > 0 ? o.kpi.overdue(formatCurrency(view.money.overdue)) : undefined
            }
            icon={<Receipt />}
            className="col-span-2 xl:col-span-1"
          />
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title={o.milestones}
            action={
              <Link
                href={routes.projects}
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                {copy.common.viewAll}
              </Link>
            }
          />
          {view.milestones.length === 0 ? (
            <EmptyState compact icon={FolderKanban} title={o.milestonesEmpty} />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {view.milestones.map((m) => {
                const late = today !== "" && lateMilestones([m], today).length > 0;
                return (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg">{m.title}</p>
                      <p className="text-[13px] text-fg-muted">{m.project}</p>
                    </div>
                    <p
                      className={
                        late ? "text-[13px] font-medium text-danger" : "text-[13px] text-fg-muted"
                      }
                    >
                      {late ? `${copy.projects.late} · ` : ""}
                      {formatDate(parseISODate(m.due), "dayMonth")}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {manager ? (
          <Card>
            <CardHeader title={o.manager} description={o.managerText} />
            <CardContent className="flex items-center gap-4">
              <Avatar name={manager.name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">{manager.name}</p>
                <p className="text-[13px] text-fg-muted">{manager.title}</p>
                <a
                  href={`mailto:${manager.email}`}
                  className="mt-1 inline-flex min-h-6 items-center gap-1.5 text-[13px] break-all text-accent-text underline underline-offset-2"
                >
                  <Mail aria-hidden className="size-3.5 shrink-0" />
                  {manager.email}
                </a>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title={o.recentTickets}
            action={
              <Link
                href={routes.tickets}
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                {copy.common.viewAll}
              </Link>
            }
          />
          {view.recentTickets.length === 0 ? (
            <EmptyState compact icon={LifeBuoy} title={copy.tickets.empty} />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {view.recentTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={routes.ticket(ticket.id)}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 hover:bg-surface-2 sm:px-6"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        {ticket.subject}
                      </span>
                      <span className="block text-[13px] text-fg-muted">
                        {ticket.number} · {formatDate(ticket.updatedAt, "short")}
                      </span>
                    </span>
                    <TicketStatusBadge value={ticket.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title={o.recentDocuments}
            action={
              <Link
                href={routes.documents}
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                {copy.common.viewAll}
              </Link>
            }
          />
          <ul className="mt-2 divide-y divide-line">
            {view.recentDocuments.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <FileText aria-hidden className="size-4 shrink-0 text-fg-subtle" />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{doc.name}</span>
                <span className="text-[13px] text-fg-muted">
                  {formatDate(doc.uploadedAt, "dayMonth")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}
