import { describe, expect, it } from "vitest";
import { DEMO_SETTINGS, STATIC_MENU } from "@/lib/demo/seed";
import { combineDateAndTime } from "@/lib/domain/hours";
import {
  acceptsOrders,
  cartTotals,
  fulfilmentSlots,
  isDeliverable,
  nextOrderNumber,
  nextStatus,
  orderSteps,
  prepDelayMinutes,
  prepStartTime,
} from "@/lib/domain/orders";

const settings = DEMO_SETTINGS;
const dishes = STATIC_MENU.dishes;
const priced = (cents: number) => dishes.find((d) => d.price === cents)!;
const at = (date: string, time: string) => combineDateAndTime(date, time);

describe("totali del carrello", () => {
  const dish = priced(1400);

  it("aggiunge il costo di consegna sotto la soglia gratuita", () => {
    const totals = cartTotals([{ dishId: dish.id, quantity: 2 }], dishes, "delivery", settings);
    expect(totals.subtotal).toBe(2800);
    expect(totals.deliveryFee).toBe(settings.delivery.fee);
    expect(totals.total).toBe(2800 + settings.delivery.fee);
    expect(totals.missingForMinimum).toBe(0);
    expect(totals.missingForFreeDelivery).toBe(settings.delivery.freeAbove - 2800);
  });

  it("consegna gratuita oltre la soglia, nessun costo per l'asporto", () => {
    const big = cartTotals([{ dishId: dish.id, quantity: 3 }], dishes, "delivery", settings);
    expect(big.deliveryFee).toBe(0);
    const takeaway = cartTotals([{ dishId: dish.id, quantity: 1 }], dishes, "takeaway", settings);
    expect(takeaway.deliveryFee).toBe(0);
    expect(takeaway.missingForMinimum).toBe(0);
  });

  it("segnala quanto manca all'ordine minimo e ignora piatti sconosciuti", () => {
    const totals = cartTotals(
      [
        { dishId: dish.id, quantity: 1 },
        { dishId: "inesistente", quantity: 5 },
      ],
      dishes,
      "delivery",
      settings,
    );
    expect(totals.items).toBe(1);
    expect(totals.missingForMinimum).toBe(settings.delivery.minOrder - 1400);
  });
});

describe("consegna e orari", () => {
  it("consegna solo nei CAP serviti", () => {
    expect(isDeliverable("40121", settings)).toBe(true);
    expect(isDeliverable(" 40125 ", settings)).toBe(true);
    expect(isDeliverable("20121", settings)).toBe(false);
  });

  it("propone orari ogni 15 minuti dopo preparazione e consegna", () => {
    const now = at("2026-10-21", "19:10");
    const slots = fulfilmentSlots("delivery", settings, now);
    const lead = settings.delivery.prepMinutes + settings.delivery.deliveryMinutes;
    expect(slots[0]!.getTime()).toBeGreaterThanOrEqual(now.getTime() + lead * 60_000);
    expect(slots.every((s) => s.getMinutes() % 15 === 0)).toBe(true);
    expect(slots.at(-1)!.getTime()).toBeLessThanOrEqual(at("2026-10-21", "23:00").getTime());
  });

  it("non accetta ordini nei giorni di chiusura o se il servizio è disattivato", () => {
    expect(acceptsOrders("takeaway", settings, at("2026-10-19", "19:00"))).toBe(false);
    expect(acceptsOrders("takeaway", settings, at("2026-10-21", "18:00"))).toBe(true);
    const noDelivery = { ...settings, delivery: { ...settings.delivery, enabled: false } };
    expect(acceptsOrders("delivery", noDelivery, at("2026-10-21", "18:00"))).toBe(false);
  });
});

describe("flusso degli stati", () => {
  it("l'asporto salta la fase di consegna", () => {
    expect(orderSteps("takeaway")).not.toContain("out_for_delivery");
    expect(nextStatus({ type: "takeaway", status: "ready" })).toBe("completed");
    expect(nextStatus({ type: "delivery", status: "ready" })).toBe("out_for_delivery");
    expect(nextStatus({ type: "delivery", status: "completed" })).toBeNull();
    expect(nextStatus({ type: "delivery", status: "cancelled" })).toBeNull();
  });

  it("numera gli ordini in modo progressivo", () => {
    expect(nextOrderNumber([])).toBe("1001");
    expect(nextOrderNumber([{ number: "1004" }, { number: "1002" }])).toBe("1005");
  });

  it("calcola quando avviare la preparazione e il ritardo", () => {
    const order = {
      type: "delivery" as const,
      status: "new" as const,
      scheduledFor: at("2026-10-21", "20:30").toISOString(),
    };
    const lead = settings.delivery.prepMinutes + settings.delivery.deliveryMinutes;
    expect(prepStartTime(order, settings).getTime()).toBe(
      at("2026-10-21", "20:30").getTime() - lead * 60_000,
    );
    expect(prepDelayMinutes(order, settings, at("2026-10-21", "19:00"))).toBe(0);
    const late = new Date(prepStartTime(order, settings).getTime() + 12 * 60_000);
    expect(prepDelayMinutes(order, settings, late)).toBe(12);
    expect(prepDelayMinutes({ ...order, status: "preparing" }, settings, late)).toBe(0);
  });
});
