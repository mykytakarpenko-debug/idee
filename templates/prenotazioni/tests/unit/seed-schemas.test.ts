import { describe, expect, it } from "vitest";
import { createDemoData, DEMO_SETTINGS } from "@/lib/demo/seed";
import { availableSlots, isBlocking, workingIntervals } from "@/lib/domain/availability";
import { toISODate } from "@/lib/domain/dates";
import {
  bookingRulesSchema,
  codeSchema,
  detailsSchema,
  infoFormSchema,
  serviceFormSchema,
} from "@/lib/domain/schemas";
import { createIcsEvent } from "@/lib/ics";
import { businessJsonLd, serializeJsonLd } from "@/lib/seo";
import { at, NOW } from "./helpers";

describe("dati demo", () => {
  const data = createDemoData(NOW);
  const nowMs = NOW.getTime();

  it("sono deterministici per la stessa data", () => {
    expect(createDemoData(NOW)).toEqual(data);
  });

  it("hanno un volume realistico", () => {
    expect(data.appointments.length).toBeGreaterThan(250);
    expect(data.appointments.length).toBeLessThan(600);
  });

  it("rispettano servizi, professionisti e modalità", () => {
    for (const a of data.appointments) {
      const service = data.services.find((s) => s.id === a.serviceId);
      expect(service, a.id).toBeDefined();
      expect(service!.staffIds).toContain(a.staffId);
      expect(service!.modes).toContain(a.mode);
      expect(new Date(a.end).getTime() - new Date(a.start).getTime()).toBe(
        service!.durationMin * 60_000,
      );
    }
  });

  it("cadono negli orari di lavoro e fuori dalle assenze", () => {
    for (const a of data.appointments) {
      const start = new Date(a.start).getTime();
      const end = new Date(a.end).getTime();
      const ranges = workingIntervals(a.staffId, toISODate(new Date(a.start)), data);
      expect(
        ranges.some((r) => r.start <= start && end <= r.end),
        `${a.id} ${a.start}`,
      ).toBe(true);
    }
  });

  it("non si sovrappongono per lo stesso professionista (buffer compreso)", () => {
    const buffer = new Map(data.services.map((s) => [s.id, s.bufferMin]));
    const active = data.appointments.filter((a) => a.status !== "cancelled");
    for (const person of data.staff) {
      const own = active
        .filter((a) => a.staffId === person.id)
        .map((a) => ({
          id: a.id,
          start: new Date(a.start).getTime(),
          end: new Date(a.end).getTime() + (buffer.get(a.serviceId) ?? 0) * 60_000,
        }))
        .sort((x, y) => x.start - y.start);
      for (let i = 1; i < own.length; i += 1) {
        expect(own[i]!.start, `${own[i - 1]!.id} / ${own[i]!.id}`).toBeGreaterThanOrEqual(
          own[i - 1]!.end,
        );
      }
    }
  });

  it("hanno codici unici e validi", () => {
    const codes = data.appointments.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(codeSchema.safeParse(code).success).toBe(true);
  });

  it("hanno stati coerenti con il tempo", () => {
    for (const a of data.appointments) {
      const ended = new Date(a.end).getTime() <= nowMs;
      if (ended) expect(["completed", "no_show", "cancelled"], a.id).toContain(a.status);
      else expect(["pending", "confirmed", "cancelled"], a.id).toContain(a.status);
      if (a.status === "pending") {
        expect(data.services.find((s) => s.id === a.serviceId)!.requiresApproval).toBe(true);
      }
      expect(new Date(a.createdAt).getTime()).toBeLessThan(nowMs);
      expect(new Date(a.createdAt).getTime()).toBeLessThan(new Date(a.start).getTime());
    }
    expect(data.appointments.some((a) => a.status === "pending")).toBe(true);
    expect(data.appointments.some((a) => a.status === "completed")).toBe(true);
  });

  it("lasciano orari prenotabili nei prossimi giorni", () => {
    for (const id of ["730", "prima-consulenza", "contratto-lavoro", "successioni"]) {
      const service = data.services.find((s) => s.id === id)!;
      const slots = ["2026-10-22", "2026-10-23", "2026-10-27"].flatMap((date) =>
        availableSlots({
          service,
          staffId: "any",
          date,
          data,
          booking: data.settings.booking,
          now: NOW,
        }),
      );
      expect(slots.length, id).toBeGreaterThan(3);
    }
  });

  it("tengono libera l'assenza di Paolo", () => {
    const [timeOff] = data.timeOff;
    expect(timeOff?.staffId).toBe("s_paolo");
    const during = data.appointments.filter(
      (a) =>
        a.staffId === "s_paolo" &&
        isBlocking(a) &&
        toISODate(new Date(a.start)) >= timeOff!.from &&
        toISODate(new Date(a.start)) <= timeOff!.to,
    );
    expect(during).toEqual([]);
  });
});

describe("schemi dei moduli", () => {
  const details = {
    name: "Marta Bianchi",
    email: "marta@example.com",
    phone: "+39 333 000 1111",
    notes: "",
    privacy: true,
    marketing: false,
  };

  it("valida i dati del cliente e richiede il consenso privacy", () => {
    expect(detailsSchema.safeParse(details).success).toBe(true);
    expect(detailsSchema.safeParse({ ...details, privacy: false }).success).toBe(false);
    expect(detailsSchema.safeParse({ ...details, email: "marta@" }).success).toBe(false);
    expect(detailsSchema.safeParse({ ...details, phone: "abc" }).success).toBe(false);
    expect(detailsSchema.safeParse({ ...details, name: "  " }).success).toBe(false);
    expect(detailsSchema.safeParse({ ...details, notes: "x".repeat(401) }).success).toBe(false);
  });

  it("normalizza il codice prenotazione", () => {
    expect(codeSchema.parse(" ag-7kq2mz ")).toBe("AG-7KQ2MZ");
    expect(codeSchema.parse("AG - 7KQ 2MZ")).toBe("AG-7KQ2MZ");
    for (const wrong of ["", "AG-123", "XX-7KQ2MZ", "AG-7KQ2MZ1", "OS-7KQ2MZ"]) {
      expect(codeSchema.safeParse(wrong).success, wrong).toBe(false);
    }
  });

  it("converte il modulo servizio in valori tipizzati", () => {
    const base = {
      name: "Consulenza successione",
      description: "Analisi dei documenti e dei passaggi necessari.",
      categoryId: "legale",
      durationMin: "60",
      bufferMin: "15",
      price: "",
      modes: ["in_person"],
      staffIds: ["s_giada"],
      requiresApproval: false,
    };
    const free = serviceFormSchema.parse(base);
    expect(free.price).toBeNull();
    expect(free.durationMin).toBe(60);
    expect(serviceFormSchema.parse({ ...base, price: "80,50" }).price).toBe(8050);
    expect(serviceFormSchema.safeParse({ ...base, price: "-3" }).success).toBe(false);
    expect(serviceFormSchema.safeParse({ ...base, durationMin: "5" }).success).toBe(false);
    expect(serviceFormSchema.safeParse({ ...base, modes: [] }).success).toBe(false);
    expect(serviceFormSchema.safeParse({ ...base, staffIds: [] }).success).toBe(false);
  });

  it("valida dati dello studio e regole di prenotazione", () => {
    const info = {
      name: DEMO_SETTINGS.name,
      tagline: DEMO_SETTINGS.tagline,
      address: DEMO_SETTINGS.address,
      postalCode: DEMO_SETTINGS.postalCode,
      city: DEMO_SETTINGS.city,
      phone: DEMO_SETTINGS.phone,
      email: DEMO_SETTINGS.email,
      vatNumber: "",
    };
    expect(infoFormSchema.safeParse(info).success).toBe(true);
    expect(infoFormSchema.safeParse({ ...info, postalCode: "1012" }).success).toBe(false);

    const rules = {
      slotStepMin: "30",
      leadTimeHours: "12",
      horizonDays: "45",
      cancelHours: "24",
      allowAnyStaff: true,
    } as const;
    expect(bookingRulesSchema.parse(rules)).toMatchObject({ leadTimeHours: 12, horizonDays: 45 });
    expect(bookingRulesSchema.safeParse({ ...rules, slotStepMin: "20" }).success).toBe(false);
    expect(bookingRulesSchema.safeParse({ ...rules, horizonDays: "0" }).success).toBe(false);
    expect(bookingRulesSchema.safeParse({ ...rules, cancelHours: "1,5" }).success).toBe(false);
  });
});

describe("calendario e SEO", () => {
  it("genera un evento .ics in UTC con testo protetto", () => {
    const ics = createIcsEvent({
      uid: "ap_1@agenda",
      start: at("2026-10-22", "10:00"),
      end: at("2026-10-22", "10:45"),
      title: "Dichiarazione dei redditi (730) · Studio Delta",
      location: "Via dell'Esempio 4, 10121 Torino",
      description: "Codice: AG-7KQ2MZ; porta i documenti",
    });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261022T080000Z");
    expect(ics).toContain("DTEND:20261022T084500Z");
    expect(ics).toContain("LOCATION:Via dell'Esempio 4\\, 10121 Torino");
    expect(ics).toContain("DESCRIPTION:Codice: AG-7KQ2MZ\\; porta i documenti");
    expect(ics.split("\r\n").at(-2)).toBe("END:VCALENDAR");
  });

  it("descrive lo studio con l'azione di prenotazione", () => {
    const json = businessJsonLd(DEMO_SETTINGS, "https://studio.example");
    expect(json["@type"]).toBe("ProfessionalService");
    expect(json.address.postalCode).toBe("10121");
    expect(json.potentialAction.target.urlTemplate).toBe("https://studio.example/prenota");
    expect(serializeJsonLd({ name: "</script><script>" })).not.toContain("</script>");
  });
});
