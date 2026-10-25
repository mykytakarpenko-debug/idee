import { addDays, startOfDay } from "date-fns";
import { toISODate } from "./dates";
import { isSale, needsFulfilment, netRevenue } from "./orders";
import type { Cents, ISODate, Order } from "./types";

/** Indicatori del pannello. Funzioni pure, testate. */

export interface DayValue {
  date: ISODate;
  revenue: Cents;
  orders: number;
}

/** Incassi netti e ordini per giorno, da "from" per "days" giorni. */
export function revenueByDay(orders: readonly Order[], from: Date, days: number): DayValue[] {
  const start = startOfDay(from);
  const result: DayValue[] = Array.from({ length: days }, (_, i) => ({
    date: toISODate(addDays(start, i)),
    revenue: 0,
    orders: 0,
  }));
  const index = new Map(result.map((d, i) => [d.date, i]));
  for (const order of orders) {
    if (!isSale(order.status)) continue;
    const i = index.get(toISODate(new Date(order.createdAt)));
    if (i === undefined) continue;
    result[i]!.revenue += netRevenue(order);
    result[i]!.orders += 1;
  }
  return result;
}

export interface SalesKpis {
  revenue: Cents;
  previousRevenue: Cents;
  orders: number;
  previousOrders: number;
  averageOrder: Cents;
  toShip: number;
  awaitingPayment: number;
  openReturns: number;
}

/** Ultimi `days` giorni (oggi compreso) rispetto ai `days` precedenti. */
export function salesKpis(orders: readonly Order[], now: Date, days = 30): SalesKpis {
  const end = addDays(startOfDay(now), 1).getTime();
  const start = addDays(startOfDay(now), 1 - days).getTime();
  const previousStart = addDays(startOfDay(now), 1 - 2 * days).getTime();
  let revenue = 0;
  let previousRevenue = 0;
  let count = 0;
  let previousCount = 0;
  for (const order of orders) {
    if (!isSale(order.status)) continue;
    const at = new Date(order.createdAt).getTime();
    if (at >= start && at < end) {
      revenue += netRevenue(order);
      count += 1;
    } else if (at >= previousStart && at < start) {
      previousRevenue += netRevenue(order);
      previousCount += 1;
    }
  }
  return {
    revenue,
    previousRevenue,
    orders: count,
    previousOrders: previousCount,
    averageOrder: count > 0 ? Math.round(revenue / count) : 0,
    toShip: orders.filter((o) => needsFulfilment(o.status)).length,
    awaitingPayment: orders.filter((o) => o.status === "awaiting_payment").length,
    openReturns: orders.filter(
      (o) => o.returnRequest?.status === "requested" || o.returnRequest?.status === "approved",
    ).length,
  };
}

/** Variazione rispetto al periodo precedente (null se non confrontabile). */
export function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

export interface TopProduct {
  productId: string;
  name: string;
  units: number;
  revenue: Cents;
}

export function topProducts(orders: readonly Order[], since: Date, limit = 5): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const order of orders) {
    if (!isSale(order.status) || new Date(order.createdAt).getTime() < since.getTime()) continue;
    for (const line of order.lines) {
      const row = map.get(line.productId) ?? {
        productId: line.productId,
        name: line.name,
        units: 0,
        revenue: 0,
      };
      row.units += line.quantity;
      row.revenue += line.unitPrice * line.quantity;
      map.set(line.productId, row);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export interface CustomerStats {
  orders: number;
  spent: Cents;
  lastOrderAt: string | null;
}

export function customerStats(orders: readonly Order[], customerId: string): CustomerStats {
  const own = orders.filter((o) => o.customerId === customerId && isSale(o.status));
  return {
    orders: own.length,
    spent: own.reduce((acc, o) => acc + netRevenue(o), 0),
    lastOrderAt:
      own
        .map((o) => o.createdAt)
        .sort()
        .at(-1) ?? null,
  };
}
