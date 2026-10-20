import { describe, expect, it } from "vitest";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import { isActiveReservation } from "@/lib/domain/booking";
import { combineDateAndTime } from "@/lib/domain/hours";
import { ALLERGENS } from "@/lib/domain/types";
import { createIcsEvent } from "@/lib/ics";
import { restaurantJsonLd, serializeJsonLd } from "@/lib/seo";

const now = combineDateAndTime("2026-10-21", "19:30");
const data = createDemoData(now);

describe("dati demo", () => {
  it("sono deterministici a parità di data", () => {
    expect(createDemoData(now)).toEqual(data);
  });

  it("riferimenti coerenti tra piatti, categorie e tavoli", () => {
    const categoryIds = new Set(data.categories.map((c) => c.id));
    const tableIds = new Set(data.tables.map((t) => t.id));
    expect(data.dishes.every((d) => categoryIds.has(d.categoryId))).toBe(true);
    expect(
      data.dishes.every((d) =>
        d.allergens.every((a) => (ALLERGENS as readonly string[]).includes(a)),
      ),
    ).toBe(true);
    expect(data.reservations.every((r) => r.tableId === null || tableIds.has(r.tableId))).toBe(
      true,
    );
  });

  it("nessun tavolo è assegnato a due gruppi nello stesso momento", () => {
    const active = data.reservations.filter((r) => r.tableId && isActiveReservation(r));
    for (const a of active) {
      const aStart = new Date(a.start).getTime();
      const aEnd = aStart + a.durationMin * 60_000;
      const clash = active.find((b) => {
        if (b.id === a.id || b.tableId !== a.tableId) return false;
        const bStart = new Date(b.start).getTime();
        return aStart < bStart + b.durationMin * 60_000 && bStart < aEnd;
      });
      expect(clash, `${a.id} si sovrappone`).toBeUndefined();
    }
  });

  it("stati coerenti con l'orario: niente prenotazioni future concluse", () => {
    const future = data.reservations.filter((r) => new Date(r.start).getTime() > now.getTime());
    expect(future.some((r) => r.status === "completed" || r.status === "no_show")).toBe(false);
    expect(data.reservations.some((r) => r.status === "seated")).toBe(true);
  });

  it("ordini con numeri univoci e totali corretti", () => {
    const numbers = data.orders.map((o) => o.number);
    expect(new Set(numbers).size).toBe(numbers.length);
    for (const order of data.orders) {
      const subtotal = order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      expect(order.subtotal).toBe(subtotal);
      expect(order.total).toBe(subtotal + order.deliveryFee);
      expect(order.type === "delivery" ? order.address : null).not.toBeUndefined();
    }
    expect(data.orders.some((o) => o.status === "new")).toBe(true);
  });
});

describe("esportazioni", () => {
  it("crea un evento .ics valido con testo protetto", () => {
    const ics = createIcsEvent({
      uid: "rs_1@tavola",
      start: combineDateAndTime("2026-10-21", "20:00"),
      end: combineDateAndTime("2026-10-21", "21:45"),
      title: "Cena, Osteria Lume",
      location: "Via dell'Esempio 8; Bologna",
      description: "Riga 1\nRiga 2",
    });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261021T180000Z");
    expect(ics).toContain("SUMMARY:Cena\\, Osteria Lume");
    expect(ics).toContain("LOCATION:Via dell'Esempio 8\\; Bologna");
    expect(ics).toContain("DESCRIPTION:Riga 1\\nRiga 2");
    expect(ics.split("\r\n").length).toBeGreaterThan(10);
  });

  it("JSON-LD con orari di apertura e serializzazione sicura", () => {
    const ld = restaurantJsonLd(DEMO_SETTINGS, "https://example.com");
    const services = DEMO_SETTINGS.hours.reduce(
      (acc, d) => acc + Number(d.lunch.open) + Number(d.dinner.open),
      0,
    );
    expect(ld.openingHoursSpecification).toHaveLength(services);
    expect(ld.hasMenu).toBe("https://example.com/menu");
    expect(serializeJsonLd({ text: "</script><script>" })).not.toContain("</script>");
  });
});
