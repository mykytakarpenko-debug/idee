import { addDays, endOfDay } from "date-fns";
import type { Cents, Order, OrderStatus, Seller } from "./types";

/** Ciclo di vita degli ordini, resi e ripartizione per venditore. Funzioni pure, testate. */

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  awaiting_payment: "paid",
  paid: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

/** Passo successivo del flusso (null se l'ordine è chiuso). */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  return NEXT[status];
}

/** Si può annullare finché non è partito. */
export function canCancel(status: OrderStatus): boolean {
  return status === "awaiting_payment" || status === "paid" || status === "processing";
}

/** Ordini pagati da preparare o spedire. */
export function needsFulfilment(status: OrderStatus): boolean {
  return status === "paid" || status === "processing";
}

/** Ordini che contano come vendite (pagati, anche se poi resi). */
export function isSale(status: OrderStatus): boolean {
  return status === "paid" || status === "processing" || status === "shipped" || status === "delivered";
}

export function orderNumber(sequence: number): string {
  return `BT-${String(10_000 + sequence)}`;
}

export function itemsCount(order: Pick<Order, "lines">): number {
  return order.lines.reduce((acc, line) => acc + line.quantity, 0);
}

export type ReturnEligibility =
  | { eligible: true; until: Date }
  | {
      eligible: false;
      until: Date | null;
      reason: "not_delivered" | "expired" | "already_requested";
    };

/**
 * Diritto di recesso: 14 giorni (o più, se il negozio lo concede) dalla consegna,
 * senza dover indicare il motivo (Codice del Consumo, artt. 52 e seguenti).
 */
export function returnEligibility(
  order: Pick<Order, "status" | "deliveredAt" | "returnRequest">,
  returnDays: number,
  now: Date,
): ReturnEligibility {
  if (order.returnRequest) return { eligible: false, until: null, reason: "already_requested" };
  if (order.status !== "delivered" || !order.deliveredAt)
    return { eligible: false, until: null, reason: "not_delivered" };
  const until = endOfDay(addDays(new Date(order.deliveredAt), returnDays));
  if (now.getTime() > until.getTime()) return { eligible: false, until, reason: "expired" };
  return { eligible: true, until };
}

/**
 * Importo da rimborsare per un reso: prezzo pagato per gli articoli restituiti,
 * al netto della quota di sconto. Se si restituisce tutto si rimborsa anche la
 * spedizione, fino al costo della consegna standard (art. 56).
 */
export function refundAmount(
  order: Pick<Order, "lines" | "subtotal" | "discount" | "shipping">,
  items: readonly { index: number; quantity: number }[],
  standardShipping: Cents,
): Cents {
  let merchandise = 0;
  let returnedUnits = 0;
  for (const item of items) {
    const line = order.lines[item.index];
    if (!line) continue;
    const quantity = Math.min(Math.max(0, item.quantity), line.quantity);
    merchandise += line.unitPrice * quantity;
    returnedUnits += quantity;
  }
  if (merchandise === 0) return 0;
  const discountShare =
    order.subtotal > 0 ? Math.round((order.discount * merchandise) / order.subtotal) : 0;
  const fullReturn = returnedUnits === itemsCount(order);
  const shipping = fullReturn ? Math.min(order.shipping, standardShipping) : 0;
  return merchandise - discountShare + shipping;
}

/** Incasso al netto dei resi rimborsati. */
export function netRevenue(order: Pick<Order, "total" | "returnRequest">): Cents {
  const refund = order.returnRequest?.status === "refunded" ? order.returnRequest.refund : 0;
  return order.total - refund;
}

export interface SellerRow {
  sellerId: string;
  orders: number;
  units: number;
  gross: Cents;
  commission: Cents;
  net: Cents;
}

/**
 * Venduto per venditore nel periodo [from, to): articoli pagati meno quelli resi
 * e rimborsati, commissione del marketplace e importo da liquidare.
 */
export function sellerBreakdown(
  orders: readonly Order[],
  sellers: readonly Pick<Seller, "id" | "commissionRate">[],
  from: Date,
  to: Date,
): SellerRow[] {
  const rows = new Map<string, SellerRow & { orderIds: Set<string> }>();
  for (const seller of sellers) {
    rows.set(seller.id, {
      sellerId: seller.id,
      orders: 0,
      units: 0,
      gross: 0,
      commission: 0,
      net: 0,
      orderIds: new Set(),
    });
  }
  for (const order of orders) {
    const at = new Date(order.createdAt).getTime();
    if (!isSale(order.status) || at < from.getTime() || at >= to.getTime()) continue;
    const refunded = order.returnRequest?.status === "refunded" ? order.returnRequest.lines : [];
    order.lines.forEach((line, index) => {
      const row = rows.get(line.sellerId);
      if (!row) return;
      const returned = refunded
        .filter((r) => r.index === index)
        .reduce((acc, r) => acc + r.quantity, 0);
      const units = Math.max(0, line.quantity - returned);
      if (units === 0) return;
      row.units += units;
      row.gross += line.unitPrice * units;
      row.orderIds.add(order.id);
    });
  }
  return sellers.map((seller) => {
    const { orderIds, ...row } = rows.get(seller.id)!;
    const commission = Math.round(row.gross * seller.commissionRate);
    return { ...row, orders: orderIds.size, commission, net: row.gross - commission };
  });
}
