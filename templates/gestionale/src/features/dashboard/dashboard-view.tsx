"use client";

import { addDays, startOfDay, subDays } from "date-fns";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  CircleCheck,
  Euro,
  Inbox,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import {
  appointmentsInRange,
  deltaRatio,
  lastWeeksRange,
  monthToDate,
  newClientsCount,
  revenue,
  revenueSeries,
  servicePopularity,
} from "@/lib/domain/analytics";
import { fullName } from "@/lib/domain/clients";
import { paymentDisplayStatus, paymentTotals } from "@/lib/domain/payments";
import {
  capitalize,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatNumber,
  formatTimeRange,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart } from "@/components/charts/column-chart";
import { AppointmentStatusBadge, PaymentStatusBadge } from "@/components/status-badges";
import { ColorDot } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "@/components/ui/toast";

const t = copy.dashboard;

export function DashboardView() {
  const ready = useDataReady();
  const now = useNow();
  if (!ready || !now) return <DashboardSkeleton />;
  return <Dashboard now={now} />;
}

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 13) return copy.greeting.morning;
  if (hour < 18) return copy.greeting.afternoon;
  return copy.greeting.evening;
}

function Dashboard({ now }: { now: Date }) {
  const { appointments, payments, clients, services, staff, settings } = useData((state) => ({
    appointments: state.appointments,
    payments: state.payments,
    clients: state.clients,
    services: state.services,
    staff: state.staff,
    settings: state.settings,
  }));
  const markPaid = useDataStore((state) => state.markPaymentPaid);
  const today = startOfDay(now);

  const stats = useMemo(() => {
    const mtd = monthToDate(now);
    const last30 = { start: subDays(today, 29), end: addDays(today, 1) };
    const prev30 = { start: subDays(today, 59), end: subDays(today, 29) };
    const todayRange = { start: today, end: addDays(today, 1) };
    const todays = appointmentsInRange(appointments, todayRange)
      .filter((a) => a.status !== "cancelled")
      .sort((a, b) => a.start.localeCompare(b.start));
    const totals = paymentTotals(payments, now);
    const outstanding = payments
      .filter((p) => p.status === "pending")
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
      .slice(0, 5);

    return {
      revenueMonth: revenue(payments, mtd.current),
      revenueDelta: deltaRatio(revenue(payments, mtd.current), revenue(payments, mtd.previous)),
      todays,
      toConfirm: todays.filter((a) => a.status === "pending").length,
      newClients: newClientsCount(clients, last30),
      newClientsDelta: deltaRatio(
        newClientsCount(clients, last30),
        newClientsCount(clients, prev30),
      ),
      totals,
      outstanding,
      weekly: revenueSeries(payments, lastWeeksRange(now, 12), "week"),
      popular: servicePopularity(appointments, services, last30, 5),
    };
  }, [appointments, payments, clients, services, now, today]);

  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const staffById = useMemo(() => new Map(staff.map((m) => [m.id, m])), [staff]);
  const firstName = settings.ownerName.split(" ")[0] ?? "";
  const nowMs = now.getTime();

  return (
    <Page>
      <PageHeader
        title={`${greeting(now)}, ${firstName}`}
        description={capitalize(formatDate(now, "long"))}
        actions={
          <>
            <Link
              href={routes.calendar}
              className={buttonClasses({ variant: "secondary", className: "max-sm:hidden" })}
            >
              <CalendarDays aria-hidden />
              {t.openCalendar}
            </Link>
            <Button onClick={() => openDialog({ type: "appointment" })}>
              <CalendarPlus aria-hidden />
              {copy.appointments.new}
            </Button>
          </>
        }
      />

      <section aria-label={t.title} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={t.kpi.revenueMonth}
          value={formatCurrency(stats.revenueMonth, { round: true })}
          delta={stats.revenueDelta}
          deltaLabel={copy.common.vsLastMonth}
          icon={<Euro />}
        />
        <StatCard
          label={t.kpi.appointmentsToday}
          value={formatNumber(stats.todays.length)}
          hint={stats.toConfirm > 0 ? t.kpi.toConfirm(stats.toConfirm) : t.kpi.allConfirmed}
          icon={<CalendarDays />}
        />
        <StatCard
          label={`${t.kpi.newClients} · ${t.kpi.last30Days}`}
          value={formatNumber(stats.newClients)}
          delta={stats.newClientsDelta}
          deltaLabel={copy.common.vsPrevious}
          icon={<Users />}
        />
        <StatCard
          label={t.kpi.outstanding}
          value={formatCurrency(stats.totals.pending + stats.totals.overdue, { round: true })}
          hint={
            stats.totals.overdueCount > 0 ? (
              <span className="text-danger">{t.kpi.overdueCount(stats.totals.overdueCount)}</span>
            ) : (
              t.kpi.noneOverdue
            )
          }
          icon={<Wallet />}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t.revenueChart} description={t.revenueChartHint} />
          <CardContent className="pt-6">
            <ColumnChart
              data={stats.weekly}
              label={t.revenueChart}
              formatValue={(value) => formatCurrency(value, { round: true })}
              formatTick={formatCurrencyCompact}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title={t.today}
            description={
              formatNumber(stats.todays.length) + " · " + capitalize(formatDate(now, "weekdayLong"))
            }
            action={
              <Link
                href={routes.calendar}
                className="text-[13px] font-medium text-accent-text hover:underline"
              >
                {copy.common.viewAll}
              </Link>
            }
          />
          {stats.todays.length === 0 ? (
            <EmptyState
              compact
              icon={CircleCheck}
              title={t.todayEmpty}
              description={t.todayEmptyHint}
            />
          ) : (
            <ol className="mt-3 max-h-[340px] flex-1 overflow-y-auto px-2 pb-3">
              {stats.todays.map((appointment) => {
                const client = clientById.get(appointment.clientId);
                const service = serviceById.get(appointment.serviceId);
                const member = staffById.get(appointment.staffId);
                const inProgress =
                  new Date(appointment.start).getTime() <= nowMs &&
                  new Date(appointment.end).getTime() > nowMs;
                const past = new Date(appointment.end).getTime() <= nowMs;
                return (
                  <li key={appointment.id}>
                    <button
                      type="button"
                      onClick={() =>
                        openDialog({ type: "appointment-details", id: appointment.id })
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2",
                        inProgress && "bg-accent-soft/60",
                      )}
                    >
                      <span className="w-[86px] shrink-0 text-[13px] text-fg-muted tabular-nums">
                        {formatTimeRange(appointment.start, appointment.end)}
                      </span>
                      {member ? <ColorDot color={member.color} /> : null}
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium",
                            past ? "text-fg-muted" : "text-fg",
                          )}
                        >
                          {client ? fullName(client) : copy.common.deletedClient}
                        </span>
                        <span className="block truncate text-xs text-fg-muted">
                          {service?.name} · {member?.name}
                        </span>
                      </span>
                      {appointment.status === "pending" ? (
                        <AppointmentStatusBadge status="pending" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t.outstanding}
            action={
              <Link
                href={routes.payments}
                className="text-[13px] font-medium text-accent-text hover:underline"
              >
                {copy.common.viewAll}
              </Link>
            }
          />
          {stats.outstanding.length === 0 ? (
            <EmptyState
              compact
              icon={Inbox}
              title={t.outstandingEmpty}
              description={t.outstandingEmptyHint}
            />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {stats.outstanding.map((payment) => {
                const status = paymentDisplayStatus(payment, now);
                const client = clientById.get(payment.clientId);
                return (
                  <li key={payment.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {client ? fullName(client) : copy.common.deletedClient}
                      </p>
                      <p className="truncate text-xs text-fg-muted">
                        {payment.number} ·{" "}
                        {status === "overdue"
                          ? t.overdueSince(formatDate(payment.dueAt, "dayMonth"))
                          : t.dueOn(formatDate(payment.dueAt, "dayMonth"))}
                      </p>
                    </div>
                    <PaymentStatusBadge status={status} />
                    <span className="w-20 text-right text-sm font-medium text-fg tabular-nums">
                      {formatCurrency(payment.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${copy.payments.markPaid}: ${payment.number}`}
                      onClick={() => {
                        markPaid(payment.id);
                        toast.success(copy.payments.markedPaid, { description: payment.number });
                      }}
                    >
                      <Check aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={t.topServices} description={t.topServicesHint} />
          <CardContent>
            {stats.popular.length === 0 ? (
              <EmptyState compact icon={UserPlus} title={copy.reports.noData} />
            ) : (
              <BarList
                label={t.topServices}
                items={stats.popular.map((item) => ({
                  id: item.id,
                  label: item.label,
                  value: item.count,
                  meta: formatCurrencyCompact(item.value),
                }))}
                formatValue={(value) => formatNumber(value)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}

export function DashboardSkeleton() {
  return (
    <Page aria-busy="true" aria-label={copy.common.loading}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[126px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-[330px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[330px] rounded-xl" />
      </div>
    </Page>
  );
}
