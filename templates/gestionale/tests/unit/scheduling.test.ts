import { describe, expect, it } from "vitest";
import { layoutOverlappingEvents } from "@/lib/domain/calendar-layout";
import {
  checkOpeningHours,
  combineDateAndTime,
  findConflicts,
  nextSlotStart,
  visibleHourRange,
} from "@/lib/domain/scheduling";
import type { Appointment, OpeningDay } from "@/lib/domain/types";

const at = (time: string, date = "2026-10-20") => combineDateAndTime(date, time);

function appointment(
  id: string,
  start: string,
  end: string,
  patch: Partial<Appointment> = {},
): Appointment {
  return {
    id,
    clientId: "cl_1",
    serviceId: "sv_1",
    staffId: "st_1",
    start: at(start).toISOString(),
    end: at(end).toISOString(),
    status: "confirmed",
    price: 4500,
    channel: "staff",
    ...patch,
  };
}

describe("findConflicts", () => {
  const agenda = [
    appointment("a", "09:00", "10:00"),
    appointment("b", "10:00", "11:00", { status: "cancelled" }),
    appointment("c", "11:00", "12:00", { staffId: "st_2" }),
  ];

  it("rileva le sovrapposizioni dello stesso operatore", () => {
    const conflicts = findConflicts(agenda, {
      staffId: "st_1",
      start: at("09:30"),
      end: at("10:30"),
    });
    expect(conflicts.map((c) => c.id)).toEqual(["a"]);
  });

  it("non considera sovrapposti gli intervalli che si toccano", () => {
    expect(
      findConflicts(agenda, { staffId: "st_1", start: at("10:00"), end: at("10:45") }),
    ).toEqual([]);
  });

  it("ignora appuntamenti annullati, altri operatori e l'appuntamento in modifica", () => {
    expect(
      findConflicts(agenda, { staffId: "st_1", start: at("10:15"), end: at("12:00") }),
    ).toEqual([]);
    expect(
      findConflicts(agenda, {
        staffId: "st_1",
        start: at("09:00"),
        end: at("10:00"),
        ignoreId: "a",
      }),
    ).toEqual([]);
  });
});

describe("orari di apertura", () => {
  const hours: OpeningDay[] = [
    { day: 2, open: true, from: "09:00", to: "19:00" },
    { day: 7, open: false, from: "09:00", to: "13:00" },
  ];

  it("accetta un appuntamento entro l'orario", () => {
    expect(checkOpeningHours(hours, at("09:00"), at("10:00"))).toBe("ok");
  });

  it("segnala fuori orario e giorno di chiusura", () => {
    expect(checkOpeningHours(hours, at("18:30"), at("19:30"))).toBe("outside");
    expect(checkOpeningHours(hours, at("10:00", "2026-10-25"), at("11:00", "2026-10-25"))).toBe(
      "closed",
    );
  });

  it("calcola la fascia oraria visibile in calendario", () => {
    expect(visibleHourRange(hours)).toEqual({ startHour: 9, endHour: 19 });
  });
});

describe("nextSlotStart", () => {
  it("arrotonda al prossimo intervallo", () => {
    expect(nextSlotStart(at("10:07"), 15).toTimeString().slice(0, 5)).toBe("10:15");
    expect(nextSlotStart(at("10:15"), 15).toTimeString().slice(0, 5)).toBe("10:30");
    expect(nextSlotStart(at("10:40"), 30).toTimeString().slice(0, 5)).toBe("11:00");
  });
});

describe("layoutOverlappingEvents", () => {
  it("assegna l'intera larghezza agli eventi isolati", () => {
    const layout = layoutOverlappingEvents([
      { id: "a", startMin: 540, endMin: 600 },
      { id: "b", startMin: 600, endMin: 660 },
    ]);
    expect(layout.get("a")).toMatchObject({ column: 0, columns: 1 });
    expect(layout.get("b")).toMatchObject({ column: 0, columns: 1 });
  });

  it("affianca gli eventi sovrapposti e riusa le colonne libere", () => {
    const layout = layoutOverlappingEvents([
      { id: "a", startMin: 540, endMin: 660 },
      { id: "b", startMin: 560, endMin: 600 },
      { id: "c", startMin: 600, endMin: 640 },
    ]);
    expect(layout.get("a")).toMatchObject({ column: 0, columns: 2 });
    expect(layout.get("b")).toMatchObject({ column: 1, columns: 2 });
    expect(layout.get("c")).toMatchObject({ column: 1, columns: 2 });
  });
});
