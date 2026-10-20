"use client";

import { addDays, startOfDay, subDays } from "date-fns";
import { CalendarCheck, ClipboardList, Euro, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import type { SeriesPoint } from "@/components/charts/types";
import { coversIn, isActiveReservation } from "@/lib/domain/booking";
import { serviceOf } from "@/lib/domain/hours";
import { isActiveOrder } from "@/lib/domain/orders";
import { capitalize, formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { ColumnChart } from "@/components/charts/column-chart";
import { OrderStatusBadge, ReservationStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "@/components/ui/toast";

const d = copy.dashboard;

export function DashboardView() {
  const ready = useDataReady();
  const now = useNow();
  if (!ready || !now) {
    return (
      <Page aria-busy="true">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[118px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </Page>
    );
  }
  return <Dashboard now={now} />;
}

function Dashboard({ now }: { now: Date }) {
  const { reservations, orders, tables } = useData((state) => ({
    reservations: state.reservations,
    orders: state.orders,
    tables: state.tables,
  }));
  const setStatus = useDataStore((state) => state.setReservationStatus);
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  const stats = useMemo(() => {
    const todays = reservations.filter((r) => {
      const ms = new Date(r.start).getTime();
      return ms >= today.getTime() && ms < tomorrow.getTime() && r.status !== "cancelled";
    });
    const lunchCovers = todays
      .filter((r) => serviceOf(new Date(r.start)) === "lunch")
      .reduce((a, r) => a + r.partySize, 0);
    const dinnerCovers = todays
      .filter((r) => serviceOf(new Date(r.start)) === "dinner")
      .reduce((a, r) => a + r.partySize, 0);
    const ordersToday = orders.filter((o) => {
      const ms = new Date(o.scheduledFor).getTime();
      return ms >= today.getTime() && ms < tomorrow.getTime() && o.status !== "cancelled";
    });
    const arrivals = reservations
      .filter((r) => {
        // Solo gli arrivi di oggi, compresi i ritardatari fino a 30 minuti.
        const ms = new Date(r.start).getTime();
        return (
          isActiveReservation(r) &&
          r.status !== "seated" &&
          ms + 30 * 60_000 >= now.getTime() &&
          ms < tomorrow.getTime()
        );
      })
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 6);
    const live = orders
      .filter(isActiveOrder)
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
    const chart: SeriesPoint[] = Array.from({ length: 14 }, (_, i) => {
      const day = subDays(today, 13 - i);
      return {
        key: formatDate(day, "inputDate"),
        label: formatDate(day, "dayMonth"),
        longLabel: capitalize(formatDate(day, "weekdayLong")),
        value: coversIn(reservations, day, addDays(day, 1)),
      };
    });
    return {
      todays,
      covers: lunchCovers + dinnerCovers,
      lunchCovers,
      dinnerCovers,
      toConfirm: todays.filter((r) => r.status === "requested").length,
      ordersToday,
      revenue: ordersToday.reduce((acc, o) => acc + o.total, 0),
      arrivals,
      live,
      chart,
    };
  }, [reservations, orders, now, today, tomorrow]);

  const tableName = (id: string | null) => tables.find((t) => t.id === id)?.name;

  return (
    <Page>
      <PageHeader title={d.title} description={capitalize(formatDate(now, "long"))} />

      <section aria-label={d.title} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={d.kpi.covers}
          value={formatNumber(stats.covers)}
          hint={`${copy.service.lunch} ${stats.lunchCovers} · ${copy.service.dinner} ${stats.dinnerCovers}`}
          icon={<Users />}
        />
        <StatCard
          label={d.kpi.reservations}
          value={formatNumber(stats.todays.length)}
          hint={
            stats.toConfirm > 0 ? (
              <span className="text-warning">{d.kpi.toConfirm(stats.toConfirm)}</span>
            ) : (
              d.kpi.allConfirmed
            )
          }
          icon={<CalendarCheck />}
        />
        <StatCard
          label={d.kpi.activeOrders}
          value={formatNumber(stats.live.length)}
          icon={<ClipboardList />}
        />
        <StatCard
          label={d.kpi.revenue}
          value={formatCurrency(stats.revenue, { round: true })}
          hint={d.kpi.ordersToday(stats.ordersToday.length)}
          icon={<Euro />}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={d.arrivals}
            action={
              <Link
                href={routes.reservations}
                className="text-[13px] font-medium text-accent-text hover:underline"
              >
                {copy.panel.nav.reservations}
              </Link>
            }
          />
          {stats.arrivals.length === 0 ? (
            <EmptyState compact icon={CalendarCheck} title={d.arrivalsEmpty} />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {stats.arrivals.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <span className="w-12 text-sm font-semibold text-fg tabular-nums">
                    {formatDate(r.start, "time")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{r.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {copy.common.people(r.partySize)}
                      {r.tableId
                        ? ` · ${copy.reservations.table} ${tableName(r.tableId)}`
                        : ` · ${copy.reservations.noTable}`}
                      {r.notes ? ` · ${r.notes}` : ""}
                    </p>
                  </div>
                  <span className="hidden sm:block">
                    <ReservationStatusBadge status={r.status} />
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setStatus(r.id, "seated");
                      toast.success(
                        copy.reservations.statusChanged(copy.status.reservation.seated),
                        { description: r.name },
                      );
                    }}
                  >
                    {copy.reservations.actions.seat}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title={d.liveOrders}
            action={
              <Link
                href={routes.orders}
                className="text-[13px] font-medium text-accent-text hover:underline"
              >
                {copy.panel.nav.orders}
              </Link>
            }
          />
          {stats.live.length === 0 ? (
            <EmptyState compact icon={ClipboardList} title={d.liveOrdersEmpty} />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {stats.live.slice(0, 6).map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => openDialog({ type: "order", id: order.id })}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2 sm:px-6"
                  >
                    <span className="w-12 text-sm font-semibold text-fg tabular-nums">
                      {formatDate(order.scheduledFor, "time")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        #{order.number} · {order.customer.name}
                      </p>
                      <p className="truncate text-xs text-fg-muted">
                        {copy.orderType[order.type]} · {formatCurrency(order.total)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title={d.coversChart} />
        <CardContent className="pt-6">
          <ColumnChart
            data={stats.chart}
            label={d.coversChart}
            formatValue={(value) => copy.common.covers(value)}
            formatTick={(value) => formatNumber(value)}
          />
        </CardContent>
      </Card>
    </Page>
  );
}
