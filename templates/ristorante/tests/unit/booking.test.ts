import { describe, expect, it } from "vitest";
import { DEMO_SETTINGS, DEMO_TABLES } from "@/lib/demo/seed";
import {
  assignTable,
  bookingSlots,
  coversIn,
  freeTables,
  reservationCode,
} from "@/lib/domain/booking";
import { combineDateAndTime } from "@/lib/domain/hours";
import type { DiningTable, Reservation } from "@/lib/domain/types";

const tables: DiningTable[] = [
  { id: "a", name: "A", seats: 2, zone: "sala", shape: "round", x: 1, y: 1 },
  { id: "b", name: "B", seats: 4, zone: "sala", shape: "square", x: 2, y: 1 },
  { id: "c", name: "C", seats: 6, zone: "sala", shape: "rect", x: 3, y: 1 },
];

function reservation(patch: Partial<Reservation>): Reservation {
  return {
    id: "r1",
    code: "LU-TEST",
    name: "Test",
    phone: "000",
    email: "",
    partySize: 2,
    start: combineDateAndTime("2026-10-21", "20:00").toISOString(),
    durationMin: 105,
    status: "confirmed",
    tableId: "a",
    source: "phone",
    marketingConsent: false,
    createdAt: new Date(0).toISOString(),
    ...patch,
  };
}

const at = (time: string) => combineDateAndTime("2026-10-21", time);

describe("assegnazione dei tavoli", () => {
  it("sceglie il tavolo più piccolo che basta", () => {
    expect(assignTable(tables, [], at("20:00"), 105, 2)?.id).toBe("a");
    expect(assignTable(tables, [], at("20:00"), 105, 3)?.id).toBe("b");
    expect(assignTable(tables, [], at("20:00"), 105, 7)).toBeNull();
  });

  it("esclude i tavoli occupati nello stesso intervallo", () => {
    const busy = [reservation({})];
    expect(freeTables(tables, busy, at("21:00"), 105, 2).map((t) => t.id)).toEqual(["b", "c"]);
    // Dopo la fine della prenotazione (20:00 + 105') il tavolo torna libero.
    expect(freeTables(tables, busy, at("21:45"), 105, 2)[0]?.id).toBe("a");
  });

  it("ignora prenotazioni annullate e quella in modifica", () => {
    expect(
      assignTable(tables, [reservation({ status: "cancelled" })], at("20:00"), 105, 2)?.id,
    ).toBe("a");
    expect(freeTables(tables, [reservation({})], at("20:00"), 105, 2, "r1")[0]?.id).toBe("a");
  });
});

describe("orari prenotabili", () => {
  const settings = DEMO_SETTINGS;

  it("rispetta ultimo arrivo e anticipo minimo", () => {
    const now = at("12:00");
    const slots = bookingSlots("2026-10-21", 2, settings, DEMO_TABLES, [], now);
    const lunch = slots.filter((s) => s.service === "lunch");
    // Pranzo 12:30–14:30, ultimo arrivo 60' prima della chiusura.
    expect(lunch.map((s) => s.time)).toEqual(["12:30", "13:00", "13:30"]);
    // Anticipo minimo 60': alle 12:00 il primo orario utile è le 13:00.
    expect(lunch.find((s) => s.time === "12:30")?.available).toBe(false);
    expect(lunch.find((s) => s.time === "13:00")?.available).toBe(true);
  });

  it("non propone orari nei giorni di chiusura", () => {
    expect(bookingSlots("2026-10-19", 2, settings, DEMO_TABLES, [], at("09:00"))).toEqual([]);
  });

  it("rifiuta gruppi oltre il massimo prenotabile online", () => {
    const slots = bookingSlots(
      "2026-10-21",
      settings.booking.maxPartySize + 1,
      settings,
      DEMO_TABLES,
      [],
      at("09:00"),
    );
    expect(slots.every((s) => !s.available)).toBe(true);
  });

  it("segna non disponibile un orario senza tavoli liberi", () => {
    const full = tables.map((t, i) => reservation({ id: `r${i}`, tableId: t.id }));
    const slots = bookingSlots("2026-10-21", 2, settings, tables, full, at("09:00"));
    expect(slots.find((s) => s.time === "20:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "22:00")?.available).toBe(true);
  });
});

describe("utilità", () => {
  it("conta i coperti escludendo annullate e no-show", () => {
    const list = [
      reservation({ id: "1", partySize: 4 }),
      reservation({ id: "2", partySize: 3, status: "cancelled" }),
      reservation({ id: "3", partySize: 2, status: "no_show" }),
    ];
    expect(coversIn(list, at("00:00"), at("23:59"))).toBe(4);
  });

  it("genera codici leggibili senza caratteri ambigui", () => {
    let i = 0;
    const values = [0, 0.5, 0.99, 0.25];
    const code = reservationCode("LU", () => values[i++ % values.length] ?? 0);
    expect(code).toMatch(/^LU-[A-HJ-NP-Z2-9]{4}$/);
  });
});
