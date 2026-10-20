import { addMinutes } from "date-fns";
import { minutesOfDay, servicesOn, timeToMinutes } from "./hours";
import type { Cents, Dish, Order, OrderStatus, OrderType, RestaurantSettings } from "./types";

/** Logica degli ordini online: totali, consegna, orari e stati. */

export interface CartLine {
  dishId: string;
  quantity: number;
}

export interface CartTotals {
  items: number;
  subtotal: Cents;
  deliveryFee: Cents;
  total: Cents;
  /** Importo mancante per raggiungere l'ordine minimo della consegna. */
  missingForMinimum: Cents;
  /** Importo mancante per la consegna gratuita. */
  missingForFreeDelivery: Cents;
}

export function cartTotals(
  lines: readonly CartLine[],
  dishes: readonly Dish[],
  type: OrderType,
  settings: RestaurantSettings,
): CartTotals {
  const byId = new Map(dishes.map((d) => [d.id, d]));
  let subtotal = 0;
  let items = 0;
  for (const line of lines) {
    const dish = byId.get(line.dishId);
    if (!dish) continue;
    subtotal += dish.price * line.quantity;
    items += line.quantity;
  }
  const { minOrder, fee, freeAbove } = settings.delivery;
  const isDelivery = type === "delivery";
  const deliveryFee = isDelivery && subtotal > 0 && subtotal < freeAbove ? fee : 0;
  return {
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    missingForMinimum: isDelivery ? Math.max(0, minOrder - subtotal) : 0,
    missingForFreeDelivery: isDelivery ? Math.max(0, freeAbove - subtotal) : 0,
  };
}

export function isDeliverable(postalCode: string, settings: RestaurantSettings): boolean {
  return settings.delivery.postalCodes.includes(postalCode.trim());
}

/**
 * Orari di ritiro/consegna disponibili oggi, a intervalli di 15 minuti,
 * dentro i servizi aperti e dopo i tempi di preparazione (e consegna).
 */
export function fulfilmentSlots(type: OrderType, settings: RestaurantSettings, now: Date): Date[] {
  const lead =
    settings.delivery.prepMinutes + (type === "delivery" ? settings.delivery.deliveryMinutes : 0);
  const earliest = addMinutes(now, lead);
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  const slots: Date[] = [];
  for (const { window } of servicesOn(settings.hours, day)) {
    const from = timeToMinutes(window.from) + lead;
    const to = timeToMinutes(window.to);
    for (let minutes = Math.ceil(from / 15) * 15; minutes <= to; minutes += 15) {
      const slot = new Date(day);
      slot.setMinutes(minutes);
      if (slot.getTime() >= earliest.getTime()) slots.push(slot);
    }
  }
  return slots;
}

/** Il locale accetta ordini adesso? (c'è almeno un orario disponibile oggi) */
export function acceptsOrders(type: OrderType, settings: RestaurantSettings, now: Date): boolean {
  if (type === "delivery" && !settings.delivery.enabled) return false;
  if (type === "takeaway" && !settings.delivery.takeawayEnabled) return false;
  return fulfilmentSlots(type, settings, now).length > 0;
}

const FLOW: Record<OrderType, OrderStatus[]> = {
  delivery: ["new", "preparing", "ready", "out_for_delivery", "completed"],
  takeaway: ["new", "preparing", "ready", "completed"],
};

/** Stato successivo nel flusso (null se concluso o annullato). */
export function nextStatus(order: Pick<Order, "type" | "status">): OrderStatus | null {
  const flow = FLOW[order.type];
  const index = flow.indexOf(order.status);
  if (index === -1 || index === flow.length - 1) return null;
  return flow[index + 1] ?? null;
}

export function orderSteps(type: OrderType): OrderStatus[] {
  return FLOW[type];
}

export function isActiveOrder(order: Pick<Order, "status">): boolean {
  return order.status !== "completed" && order.status !== "cancelled";
}

/** Prossimo numero ordine progressivo. */
export function nextOrderNumber(orders: readonly Pick<Order, "number">[]): string {
  let max = 1000;
  for (const { number } of orders) {
    const n = Number.parseInt(number, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return String(max + 1);
}

/**
 * Orario entro cui la cucina deve avviare la preparazione per rispettare
 * l'orario richiesto (ritiro o consegna).
 */
export function prepStartTime(
  order: Pick<Order, "type" | "scheduledFor">,
  settings: Pick<RestaurantSettings, "delivery">,
): Date {
  const lead =
    settings.delivery.prepMinutes +
    (order.type === "delivery" ? settings.delivery.deliveryMinutes : 0);
  return addMinutes(new Date(order.scheduledFor), -lead);
}

/** Minuti di ritardo nell'avvio della preparazione (0 se in orario o già avviato). */
export function prepDelayMinutes(
  order: Pick<Order, "type" | "scheduledFor" | "status">,
  settings: Pick<RestaurantSettings, "delivery">,
  now: Date,
): number {
  if (order.status !== "new") return 0;
  const delay = Math.floor((now.getTime() - prepStartTime(order, settings).getTime()) / 60_000);
  return Math.max(0, delay);
}

/** Minuti trascorsi da un istante (es. dalla creazione dell'ordine). */
export function minutesSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
}

export { minutesOfDay };
