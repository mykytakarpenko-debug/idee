"use client";

import { AlarmClock, FolderKanban, Gauge, LifeBuoy, Receipt } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { adminKpis, ticketsByWeek } from "@/lib/domain/analytics";
import { parseISODate } from "@/lib/domain/dates";
import { isOpenStatus, queueOrder, slaState } from "@/lib/domain/tickets";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { HealthBadge, PriorityBadge, SlaBadge } from "@/components/badges";
import { ColumnChart } from "@/components/charts/column-chart";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";

const a = copy.admin;
type Series = "opened" | "resolved";

export function DashboardView() {
  const now = useNow();
  const data = useData((state) => ({
    organizations: state.organizations,
    users: state.users,
    projects: state.projects,
    documents: state.documents,
    tickets: state.tickets,
    invoices: state.invoices,
    audit: state.audit,
    settings: state.settings,
  }));
  const [series, setSeries] = useState<Series>("opened");

  const view = useMemo(() => {
    if (!now) return null;
    const sla = data.settings.slaHours;
    return {
      kpis: adminKpis(data, now),
      weeks: ticketsByWeek(data.tickets, now, 8),
      queue: queueOrder(
        data.tickets.filter((t) => isOpenStatus(t.status) && slaState(t, sla, now) !== "on_time"),
        sla,
        now,
      ).slice(0, 6),
      atRisk: data.projects.filter((p) => p.status === "active" && p.health !== "on_track"),
    };
  }, [data, now]);

  if (!now || !view) {
    return (
      <Page>
        <PageHeader title={a.title} description={a.description} />
        <Skeleton className="h-96" />
      </Page>
    );
  }
  const { kpis } = view;
  const orgName = (id: string) => data.organizations.find((o) => o.id === id)?.name ?? "—";
  const points = view.weeks.map((w) => {
    const date = parseISODate(w.week);
    return {
      key: w.week,
      label: formatDate(date, "dayMonth"),
      longLabel: `${a[series]}, settimana del ${formatDate(date, "dayMonthLong")}`,
      value: w[series],
    };
  });

  return (
    <Page>
      <PageHeader title={a.title} description={a.description} />
      <section aria-label={a.title} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label={a.kpi.open}
          value={formatNumber(kpis.openTickets)}
          hint={kpis.breached > 0 ? a.kpi.breached(kpis.breached) : undefined}
          icon={<LifeBuoy />}
        />
        <StatCard
          label={a.kpi.compliance}
          value={kpis.slaCompliance === null ? "—" : formatPercent(kpis.slaCompliance, 0)}
          icon={<Gauge />}
        />
        <StatCard
          label={a.kpi.firstResponse}
          value={
            kpis.averageFirstResponse === null
              ? "—"
              : copy.common.minutes(kpis.averageFirstResponse)
          }
          icon={<AlarmClock />}
        />
        <StatCard label={a.kpi.overdue} value={formatCurrency(kpis.overdue)} icon={<Receipt />} />
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title={a.chart}
            description={a.chartDescription}
            action={
              <SegmentedControl
                size="sm"
                ariaLabel={a.chart}
                value={series}
                onChange={setSeries}
                options={[
                  { value: "opened", label: a.opened },
                  { value: "resolved", label: a.resolved },
                ]}
              />
            }
          />
          <CardContent className="pt-4">
            <ColumnChart
              data={points}
              label={`${a.chart}: ${a[series]}`}
              formatValue={(v) => copy.common.tickets(v)}
              formatTick={(v) => formatNumber(v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={a.queue}
            action={
              <Link
                href={routes.adminTickets}
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                {copy.common.viewAll}
              </Link>
            }
          />
          {view.queue.length === 0 ? (
            <EmptyState compact icon={LifeBuoy} title={a.queueEmpty} />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {view.queue.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={routes.adminTicket(ticket.id)}
                    className="flex flex-col gap-1.5 px-5 py-3 hover:bg-surface-2 sm:px-6"
                  >
                    <span className="text-sm font-medium text-fg">{ticket.subject}</span>
                    <span className="flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">
                      {ticket.number} · {orgName(ticket.orgId)}
                      <PriorityBadge value={ticket.priority} />
                      <SlaBadge value={slaState(ticket, data.settings.slaHours, now)} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title={a.projectsAtRisk}
          description={`${a.kpi.projects}: ${kpis.projectsAtRisk} ${a.kpi.projectsHint(kpis.activeProjects)}`}
        />
        {view.atRisk.length === 0 ? (
          <EmptyState compact icon={FolderKanban} title={a.projectsEmpty} />
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {view.atRisk.map((project) => (
              <li key={project.id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{project.name}</p>
                  <p className="text-[13px] text-fg-muted">
                    {orgName(project.orgId)} ·{" "}
                    {copy.projects.due(formatDate(parseISODate(project.due), "short"))}
                  </p>
                </div>
                <HealthBadge value={project.health} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
