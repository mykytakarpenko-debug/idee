"use client";

import { addDays, startOfDay } from "date-fns";
import { Bike, ClipboardList, Clock, ShoppingBag, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { nextStatus, prepDelayMinutes, prepStartTime } from "@/lib/domain/orders";
import type { Order, OrderStatus, RestaurantSettings } from "@/lib/domain/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { OrderStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";

const o = copy.orders;
type Column = keyof typeof o.columns;
const COLUMNS: Column[] = ["new", "preparing", "ready", "out_for_delivery"];

export function OrdersView() {
  const ready = useDataReady();
  const now = useNow();
  const { orders, settings } = useData((state) => ({
    orders: state.orders,
    settings: state.settings,
  }));
  const [mobileColumn, setMobileColumn] = useState<Column>("new");

  const { byColumn, closedToday } = useMemo(() => {
    const byColumn = Object.fromEntries(COLUMNS.map((c) => [c, [] as Order[]])) as Record<
      Column,
      Order[]
    >;
    for (const order of orders) {
      if (order.status in byColumn) byColumn[order.status as Column].push(order);
    }
    for (const column of COLUMNS)
      byColumn[column].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
    const today = now ? startOfDay(now).getTime() : 0;
    const tomorrow = now ? addDays(startOfDay(now), 1).getTime() : 0;
    const closedToday = orders
      .filter((order) => order.status === "completed" || order.status === "cancelled")
      .filter((order) => {
        const ms = new Date(order.scheduledFor).getTime();
        return ms >= today && ms < tomorrow;
      })
      .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
    return { byColumn, closedToday };
  }, [orders, now]);

  if (!ready || !now) {
    return (
      <Page aria-busy="true">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((c) => (
            <Skeleton key={c} className="h-72 rounded-xl" />
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title={o.title} description={o.description} />

      <SegmentedControl<Column>
        ariaLabel={o.title}
        className="lg:hidden"
        value={mobileColumn}
        onChange={setMobileColumn}
        options={COLUMNS.map((c) => ({
          value: c,
          label: `${o.columns[c]} (${byColumn[c].length})`,
        }))}
      />

      <div className="grid items-start gap-4 lg:grid-cols-4">
        {COLUMNS.map((column) => (
          <section
            key={column}
            aria-label={o.columns[column]}
            className={cn(
              "flex flex-col gap-3 rounded-xl bg-surface-2 p-3",
              column !== mobileColumn && "max-lg:hidden",
            )}
          >
            <h2 className="flex items-center justify-between px-1 text-sm font-semibold text-fg">
              {o.columns[column]}
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-fg-muted tabular-nums">
                {byColumn[column].length}
              </span>
            </h2>
            {byColumn[column].length === 0 ? (
              <p className="px-1 pb-2 text-[13px] text-fg-muted">{o.empty}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {byColumn[column].map((order) => (
                  <OrderCard key={order.id} order={order} now={now} settings={settings} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <Card>
        <CardHeader title={o.completedToday} />
        {closedToday.length === 0 ? (
          <EmptyState compact icon={ClipboardList} title={o.empty} />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {closedToday.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => openDialog({ type: "order", id: order.id })}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2 sm:px-6"
                >
                  <span className="w-12 text-sm font-semibold text-fg tabular-nums">
                    {formatDate(order.scheduledFor, "time")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      #{order.number} · {order.customer.name}
                    </span>
                    <span className="block truncate text-xs text-fg-muted">
                      {copy.orderType[order.type]} · {formatCurrency(order.total)}
                    </span>
                  </span>
                  <OrderStatusBadge status={order.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}

function OrderCard({
  order,
  now,
  settings,
}: {
  order: Order;
  now: Date;
  settings: RestaurantSettings;
}) {
  const setOrderStatus = useDataStore((state) => state.setOrderStatus);
  const next = nextStatus(order);
  // Un ordine nuovo è in ritardo se la preparazione doveva già partire.
  const delay = prepDelayMinutes(order, settings, now);
  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const TypeIcon = order.type === "delivery" ? Bike : ShoppingBag;

  const advance = (status: OrderStatus) => {
    const previous = order.status;
    setOrderStatus(order.id, status);
    toast.success(o.advanced(copy.status.order[status]), {
      description: `#${order.number}`,
      action: { label: copy.common.cancel, onClick: () => setOrderStatus(order.id, previous) },
    });
  };

  return (
    <li className="rounded-lg border border-line bg-surface shadow-xs">
      <button
        type="button"
        onClick={() => openDialog({ type: "order", id: order.id })}
        className="block w-full rounded-t-lg p-3 text-left transition-colors hover:bg-surface-2/60"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-fg">#{order.number}</span>
          <span className="flex items-center gap-1 text-[13px] font-medium text-fg tabular-nums">
            <Clock aria-hidden className="size-3.5 text-fg-muted" />
            {o.due(formatDate(order.scheduledFor, "time"))}
          </span>
        </span>
        <span className="mt-1 block truncate text-[13px] text-fg">{order.customer.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
          <TypeIcon aria-hidden className="size-3.5" />
          {copy.orderType[order.type]} · {copy.common.items(itemCount)} ·{" "}
          {formatCurrency(order.total)}
        </span>
        {order.status === "new" ? (
          delay > 0 ? (
            <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning">
              <TriangleAlert aria-hidden className="size-3" />
              {o.late(delay)}
            </span>
          ) : (
            <span className="mt-2 block text-xs text-fg-muted">
              {o.startBy(formatDate(prepStartTime(order, settings), "time"))}
            </span>
          )
        ) : null}
      </button>
      {next ? (
        <div className="border-t border-line p-2">
          <Button
            size="sm"
            variant={order.status === "new" ? "primary" : "secondary"}
            className="w-full"
            onClick={() => advance(next)}
          >
            {o.advance[next as keyof typeof o.advance]}
            <span className="sr-only"> · #{order.number}</span>
          </Button>
        </div>
      ) : null}
    </li>
  );
}
