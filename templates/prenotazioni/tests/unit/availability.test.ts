import { describe, expect, it } from "vitest";
import { HOURS, SERVICES, STAFF } from "@/lib/demo/seed";
import {
  ANY_STAFF,
  availableDays,
  availableSlots,
  bookingCode,
  conflictsWithTimeOff,
  initialStatus,
  manageability,
  occupancy,
  pickStaff,
  rangesValid,
  staffSlots,
  workingIntervals,
} from "@/lib/domain/availability";
import { codeSchema } from "@/lib/domain/schemas";
import type { TimeOff } from "@/lib/domain/types";
import { appointment, at, booking, NOW, query, service, times } from "./helpers";

// Mercoledì 21/10/2026: giovedì 22, sabato 24, domenica 25, lunedì 26.
const THURSDAY = "2026-10-22";

const off = (patch: Partial<TimeOff>): TimeOff => ({
  id: "off_t",
  staffId: "s_paolo",
  from: "2026-10-29",
  to: "2026-10-31",
  reason: "Ferie",
  ...patch,
});

describe("workingIntervals", () => {
  const data = { hours: HOURS, timeOff: [] };

  it("restituisce le fasce del giorno, pausa compresa", () => {
    const ranges = workingIntervals("s_laura", "2026-10-21", data);
    expect(ranges.map((r) => times([new Date(r.start), new Date(r.end)]))).toEqual([
      ["09:00", "13:00"],
      ["14:30", "18:00"],
    ]);
  });

  it("è vuoto nei giorni in cui non riceve", () => {
    expect(workingIntervals("s_laura", "2026-10-25", data)).toEqual([]);
    expect(workingIntervals("s_giada", "2026-10-26", data)).toEqual([]);
  });

  it("considera le assenze personali e le chiusure dello studio", () => {
    const paoloOff = { hours: HOURS, timeOff: [off({ from: THURSDAY, to: THURSDAY })] };
    expect(workingIntervals("s_paolo", THURSDAY, paoloOff)).toEqual([]);
    expect(workingIntervals("s_laura", THURSDAY, paoloOff)).toHaveLength(2);

    const closed = {
      hours: HOURS,
      timeOff: [off({ staffId: null, from: THURSDAY, to: THURSDAY })],
    };
    for (const person of STAFF) expect(workingIntervals(person.id, THURSDAY, closed)).toEqual([]);
  });
});

describe("staffSlots", () => {
  const sv730 = service("730"); // 45 minuti + 15 di buffer, solo Laura

  it("propone gli orari allineati al passo che finiscono entro la fascia", () => {
    const slots = staffSlots(query({ service: sv730, date: THURSDAY }), "s_laura");
    expect(times(slots)).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
    ]);
  });

  it("toglie gli orari che si sovrappongono a un appuntamento e al suo buffer", () => {
    const taken = appointment(THURSDAY, "10:00", 45); // occupa 10:00–11:00 con il buffer
    const data = { ...query({ service: sv730, date: THURSDAY }).data, appointments: [taken] };
    const slots = times(staffSlots(query({ service: sv730, date: THURSDAY, data }), "s_laura"));
    expect(slots).toContain("09:00"); // 09:00–10:00 con il buffer: tocca ma non sovrappone
    expect(slots).not.toContain("09:30");
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("10:30");
    expect(slots).toContain("11:00");
  });

  it("applica anche il buffer del servizio da prenotare", () => {
    const short = appointment(THURSDAY, "11:00", 20, { serviceId: "prima-consulenza" });
    const data = { ...query({ service: sv730, date: THURSDAY }).data, appointments: [short] };
    const slots = times(staffSlots(query({ service: sv730, date: THURSDAY, data }), "s_laura"));
    expect(slots).toContain("10:00"); // 10:00–11:00 con il buffer
    expect(slots).not.toContain("10:30");
    expect(slots).not.toContain("11:00");
    expect(slots).toContain("11:30"); // la prima consulenza libera alle 11:30 con il suo buffer
  });

  it("ignora gli appuntamenti cancellati e quello che si sta spostando", () => {
    const cancelled = appointment(THURSDAY, "10:00", 45, { status: "cancelled" });
    const moving = appointment(THURSDAY, "15:00", 45);
    const data = {
      ...query({ service: sv730, date: THURSDAY }).data,
      appointments: [cancelled, moving],
    };
    const slots = times(
      staffSlots(
        query({ service: sv730, date: THURSDAY, data, ignoreAppointmentId: moving.id }),
        "s_laura",
      ),
    );
    expect(slots).toContain("10:00");
    expect(slots).toContain("15:00");
  });

  it("rispetta l'anticipo minimo", () => {
    const today = "2026-10-21";
    expect(staffSlots(query({ service: sv730, date: today }), "s_laura")).toEqual([]);
    const noLead = staffSlots(
      query({ service: sv730, date: today, booking: booking({ leadTimeHours: 0 }) }),
      "s_laura",
    );
    expect(times(noLead)[0]).toBe("10:00");
    const twoHours = staffSlots(
      query({ service: sv730, date: today, booking: booking({ leadTimeHours: 2 }) }),
      "s_laura",
    );
    expect(times(twoHours)[0]).toBe("12:00");
  });

  it("non va oltre l'orizzonte di prenotazione", () => {
    // 45 giorni dal 21/10 = sabato 5 dicembre.
    expect(staffSlots(query({ service: sv730, date: "2026-12-04" }), "s_laura")).not.toEqual([]);
    expect(staffSlots(query({ service: sv730, date: "2026-12-07" }), "s_laura")).toEqual([]);
  });

  it("allinea il primo orario al passo anche se la fascia inizia a metà", () => {
    const contract = service("contratto-lavoro");
    const slots = staffSlots(
      query({ service: contract, date: "2026-10-26", booking: booking({ slotStepMin: 60 }) }),
      "s_paolo",
    );
    expect(times(slots)[0]).toBe("10:00"); // Paolo inizia alle 9:30
  });
});

describe("availableSlots", () => {
  const first = service("prima-consulenza"); // 20 minuti, tutti i professionisti

  it("con il primo disponibile unisce gli orari di tutti, in ordine", () => {
    const slots = availableSlots(query({ service: first, date: THURSDAY }));
    const byTime = new Map(slots.map((s) => [times([s.start])[0], s.staffIds]));
    expect(byTime.get("09:00")).toEqual(["s_laura"]);
    expect(byTime.get("09:30")).toEqual(["s_laura", "s_paolo"]);
    expect(byTime.get("10:00")).toEqual(["s_laura", "s_paolo", "s_giada"]);
    expect(byTime.get("14:00")).toEqual(["s_paolo"]);
    expect(times([slots.at(-1)!.start])).toEqual(["18:30"]);
    const starts = slots.map((s) => s.start.getTime());
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(slots[0]!.end.getTime() - slots[0]!.start.getTime()).toBe(20 * 60_000);
  });

  it("con un professionista scelto propone solo i suoi orari", () => {
    const slots = availableSlots(query({ service: first, date: THURSDAY, staffId: "s_paolo" }));
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.staffIds.join() === "s_paolo")).toBe(true);
  });

  it("è vuoto se il professionista non offre il servizio", () => {
    expect(
      availableSlots(query({ service: service("730"), date: THURSDAY, staffId: "s_giada" })),
    ).toEqual([]);
  });
});

describe("availableDays", () => {
  it("evidenzia solo i giorni con almeno un orario libero", () => {
    const base = query({ service: service("730"), date: THURSDAY, staffId: "s_laura" });
    const days = availableDays(base, 7);
    expect([...days].sort()).toEqual([
      "2026-10-22",
      "2026-10-23",
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
    ]);
  });
});

describe("pickStaff", () => {
  const ids = ["s_laura", "s_paolo", "s_giada"];

  it("sceglie chi ha meno appuntamenti quel giorno", () => {
    const appointments = [
      appointment(THURSDAY, "09:00", 45, { staffId: "s_laura" }),
      appointment(THURSDAY, "11:00", 45, { staffId: "s_laura" }),
      appointment(THURSDAY, "10:00", 45, { staffId: "s_paolo" }),
    ];
    expect(pickStaff(ids, appointments, THURSDAY)).toBe("s_giada");
  });

  it("a parità segue l'ordine del servizio e ignora cancellati e altri giorni", () => {
    const appointments = [
      appointment(THURSDAY, "09:00", 45, { staffId: "s_laura" }),
      appointment(THURSDAY, "10:00", 45, { staffId: "s_paolo", status: "cancelled" }),
      appointment("2026-10-23", "10:00", 45, { staffId: "s_paolo" }),
    ];
    expect(pickStaff(ids, appointments, THURSDAY)).toBe("s_paolo");
  });
});

describe("occupancy", () => {
  const base = { staff: STAFF, hours: HOURS, timeOff: [] as TimeOff[] };
  // Giovedì: Laura 7,5 h + Paolo 7 h + Giada 7 h = 1290 minuti di apertura.
  const from = at(THURSDAY, "00:00");

  it("rapporta i minuti prenotati a quelli di apertura", () => {
    const appointments = [
      appointment(THURSDAY, "10:00", 45),
      appointment(THURSDAY, "11:00", 45, { status: "cancelled" }),
    ];
    expect(occupancy({ ...base, appointments }, from, 1)).toBeCloseTo(45 / 1290, 6);
    expect(occupancy({ ...base, appointments: [] }, from, 1)).toBe(0);
  });

  it("è zero se lo studio è chiuso", () => {
    const timeOff = [off({ staffId: null, from: THURSDAY, to: THURSDAY })];
    expect(
      occupancy({ ...base, timeOff, appointments: [appointment(THURSDAY, "10:00", 45)] }, from, 1),
    ).toBe(0);
  });
});

describe("rangesValid", () => {
  it.each([
    [[], true],
    [[{ from: "09:00", to: "13:00" }], true],
    [
      [
        { from: "14:00", to: "18:00" },
        { from: "09:00", to: "13:00" },
      ],
      true,
    ],
    [
      [
        { from: "09:00", to: "13:00" },
        { from: "13:00", to: "15:00" },
      ],
      true,
    ],
    [[{ from: "10:00", to: "09:00" }], false],
    [[{ from: "10:00", to: "10:00" }], false],
    [
      [
        { from: "09:00", to: "13:00" },
        { from: "12:00", to: "15:00" },
      ],
      false,
    ],
  ])("%j → %s", (ranges, expected) => {
    expect(rangesValid(ranges)).toBe(expected);
  });
});

describe("conflictsWithTimeOff", () => {
  const appointments = [
    appointment("2026-10-29", "10:00", 45, { id: "a", staffId: "s_paolo" }),
    appointment("2026-10-30", "10:00", 45, { id: "b", staffId: "s_paolo", status: "cancelled" }),
    appointment("2026-10-29", "11:00", 45, { id: "c", staffId: "s_laura" }),
    appointment("2026-11-02", "10:00", 45, { id: "d", staffId: "s_paolo" }),
  ];

  it("trova gli appuntamenti attivi del professionista nel periodo", () => {
    expect(conflictsWithTimeOff(appointments, off({})).map((a) => a.id)).toEqual(["a"]);
  });

  it("per una chiusura dello studio li trova per tutti", () => {
    const closed = off({ staffId: null, from: "2026-10-29", to: "2026-10-29" });
    expect(conflictsWithTimeOff(appointments, closed).map((a) => a.id)).toEqual(["a", "c"]);
  });
});

describe("manageability", () => {
  const rules = { cancelHours: 24 };

  it.each([
    ["cancellato", { status: "cancelled", start: "2026-10-30" }, "closed"],
    ["concluso", { status: "completed", start: "2026-10-30" }, "closed"],
    ["passato", { status: "confirmed", start: "2026-10-21T09:00" }, "past"],
    ["entro 24 ore", { status: "confirmed", start: "2026-10-22T09:00" }, "too_late"],
  ] as const)("%s → %s", (_label, input, reason) => {
    const start = at(input.start.slice(0, 10), input.start.slice(11) || "10:00").toISOString();
    expect(manageability({ status: input.status, start }, rules, NOW)).toEqual({
      allowed: false,
      reason,
    });
  });

  it("consente modifiche fino al limite esatto", () => {
    const exactly = at(THURSDAY, "10:00").toISOString();
    expect(manageability({ status: "confirmed", start: exactly }, rules, NOW)).toEqual({
      allowed: true,
    });
    const pending = at("2026-10-25", "10:00").toISOString();
    expect(manageability({ status: "pending", start: pending }, rules, NOW).allowed).toBe(true);
  });
});

describe("bookingCode e initialStatus", () => {
  it("genera codici leggibili senza caratteri ambigui", () => {
    expect(bookingCode(() => 0)).toBe("AG-AAAAAA");
    expect(bookingCode(() => 0.9999)).toBe("AG-999999");
    for (let i = 0; i < 200; i += 1) {
      const code = bookingCode(Math.random);
      expect(code).toMatch(/^AG-[A-HJ-NP-Z2-9]{6}$/);
      expect(codeSchema.safeParse(code).success).toBe(true);
    }
  });

  it("le richieste da approvare partono da confermare", () => {
    expect(initialStatus(service("prima-consulenza"))).toBe("pending");
    expect(initialStatus(service("730"))).toBe("confirmed");
  });

  it("ANY_STAFF è il valore usato dal modulo", () => {
    expect(ANY_STAFF).toBe("any");
    expect(SERVICES.filter((s) => s.requiresApproval).map((s) => s.id)).toEqual([
      "prima-consulenza",
    ]);
  });
});
