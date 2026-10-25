"use client";

import { addDays, startOfDay } from "date-fns";
import { Euro, PackageCheck, Receipt, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useData, useDataReady } from "@/hooks/use-data";
import { useNow } from "@/hooks/use-now";
import { change, revenueByDay, salesKpis, topProducts } from "@/lib/domain/analytics";
import { parseISODate } from "@/lib/domain/dates";
import { lowStockVariants } from "@/lib/domain/inventory";
import { itemsCount, needsFulfilment } from "@/lib/domain/orders";
import {
  capitalize,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatNumber,
} from "@/lib/format";
import { openDialog } from "@/store/ui-store";
import { BarList } from "@/components/charts/bar-list";
import { ColumnChart } from "@/components/charts/column-chart";
import { ProductArt } from "@/components/product/product-art";
import { OrderStatusBadge, ReturnStatusBadge } from "@/components/status-badges";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";

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
  const { orders, products, settings } = useData((state) => ({
    orders: state.orders,
    products: state.products,
    settings: state.settings,
  }));

  const stats = useMemo(() => {
    const from = addDays(startOfDay(now), -29);
    return {
      kpis: salesKpis(orders, now, 30),
      chart: revenueByDay(orders, from, 30).map((day) => {
        const date = parseISODate(day.date);
        return {
          key: day.date,
          label: formatDate(date, "dayMonth"),
          longLabel: capitalize(formatDate(date, "weekdayLong")),
          value: day.revenue,
        };
      }),
      top: topProducts(orders, from, 5),
      toShip: orders
        .filter((o) => needsFulfilment(o.status))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      returns: orders.filter(
        (o) => o.returnRequest?.status === "requested" || o.returnRequest?.status === "approved",
      ),
      lowStock: lowStockVariants(products, settings.lowStockThreshold).slice(0, 6),
    };
  }, [orders, products, settings.lowStockThreshold, now]);

  const k = stats.kpis;
  return (
    <Page>
      <PageHeader title={d.title} description={d.period} />

      <section aria-label={d.period} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label={d.kpi.revenue}
          value={formatCurrency(k.revenue, { round: true })}
          delta={change(k.revenue, k.previousRevenue)}
          deltaLabel={d.vsPrevious}
          icon={<Euro />}
        />
        <StatCard
          label={d.kpi.orders}
          value={formatNumber(k.orders)}
          delta={change(k.orders, k.previousOrders)}
          deltaLabel={d.vsPrevious}
          icon={<ShoppingBag />}
        />
        <StatCard label={d.kpi.average} value={formatCurrency(k.averageOrder)} icon={<Receipt />} />
        <StatCard
          label={d.kpi.toShip}
          value={formatNumber(k.toShip)}
          hint={k.awaitingPayment > 0 ? d.kpi.toShipHint(k.awaitingPayment) : undefined}
          icon={<PackageCheck />}
        />
      </section>

      <Card>
        <CardHeader title={d.chartTitle} description={d.chartDescription} />
        <CardContent className="pt-6">
          <ColumnChart
            data={stats.chart}
            label={d.chartTitle}
            formatValue={(value) => formatCurrency(value)}
            formatTick={(value) => formatCurrencyCompact(value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={d.toShip}
            action={
              <Link
                href={routes.orders}
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                {copy.home.viewAll}
              </Link>
            }
          />
          {stats.toShip.length === 0 ? (
            <EmptyState compact icon={PackageCheck} title={d.toShipEmpty} />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {stats.toShip.slice(0, 6).map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => openDialog({ type: "order", id: order.id })}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-left hover:bg-surface-2 sm:px-6"
                  >
                    <span className="text-sm font-medium text-fg">{order.number}</span>
                    <span className="text-[13px] text-fg-muted">
                      {order.shippingAddress.name} · {copy.common.items(itemsCount(order))}
                    </span>
                    <span className="ml-auto">
                      <OrderStatusBadge status={order.status} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={d.topProducts} />
          <CardContent>
            <BarList
              label={d.topProducts}
              items={stats.top.map((p) => ({
                id: p.productId,
                label: p.name,
                value: p.revenue,
                meta: copy.common.items(p.units),
              }))}
              formatValue={(value) => formatCurrency(value, { round: true })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={d.lowStock}
            action={
              <Link
                href={routes.products}
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                {copy.home.viewAll}
              </Link>
            }
          />
          {stats.lowStock.length === 0 ? (
            <EmptyState compact icon={PackageCheck} title={d.lowStockEmpty} />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {stats.lowStock.map(({ product, variant }) => (
                <li key={variant.id}>
                  <button
                    type="button"
                    onClick={() => openDialog({ type: "product", id: product.id })}
                    className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-surface-2 sm:px-6"
                  >
                    <span className="size-10 shrink-0 overflow-hidden rounded-md bg-surface-2">
                      <ProductArt kind={product.art} color={variant.color} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block truncate font-medium text-fg">{product.name}</span>
                      <span className="block text-[13px] text-fg-muted">{variant.name}</span>
                    </span>
                    <span
                      className={
                        variant.stock === 0
                          ? "text-[13px] font-medium text-danger"
                          : "text-[13px] font-medium text-warning"
                      }
                    >
                      {d.left(variant.stock)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title={d.returns} />
          {stats.returns.length === 0 ? (
            <EmptyState compact icon={PackageCheck} title={d.returnsEmpty} />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {stats.returns.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => openDialog({ type: "order", id: order.id })}
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-left hover:bg-surface-2 sm:px-6"
                  >
                    <span className="text-sm font-medium text-fg">{order.number}</span>
                    <span className="text-[13px] text-fg-muted">
                      {order.shippingAddress.name} ·{" "}
                      {formatCurrency(order.returnRequest?.refund ?? 0)}
                    </span>
                    <span className="ml-auto">
                      {order.returnRequest ? (
                        <ReturnStatusBadge status={order.returnRequest.status} />
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  );
}
