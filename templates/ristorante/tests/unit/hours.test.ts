import { describe, expect, it } from "vitest";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import {
  combineDateAndTime,
  currentService,
  isoWeekday,
  minutesToTime,
  nextOpening,
  servicesOn,
  serviceOf,
  timeToMinutes,
  upcomingServiceTime,
} from "@/lib/domain/hours";

const hours = DEMO_SETTINGS.hours;
// 19 ottobre 2026 = lunedì (chiuso), 20 = martedì (solo cena), 21 = mercoledì (pranzo e cena).
const at = (date: string, time: string) => combineDateAndTime(date, time);

describe("conversioni orarie", () => {
  it("converte HH:mm in minuti e ritorno", () => {
    expect(timeToMinutes("19:30")).toBe(1170);
    expect(minutesToTime(1170)).toBe("19:30");
    expect(minutesToTime(timeToMinutes("00:05"))).toBe("00:05");
  });

  it("usa la settimana ISO (lunedì = 1, domenica = 7)", () => {
    expect(isoWeekday(at("2026-10-19", "12:00"))).toBe(1);
    expect(isoWeekday(at("2026-10-25", "12:00"))).toBe(7);
  });

  it("classifica pranzo e cena", () => {
    expect(serviceOf(at("2026-10-21", "13:00"))).toBe("lunch");
    expect(serviceOf(at("2026-10-21", "20:00"))).toBe("dinner");
  });
});

describe("servizi del locale demo", () => {
  it("lunedì è chiuso, martedì solo cena, mercoledì pranzo e cena", () => {
    expect(servicesOn(hours, at("2026-10-19", "12:00"))).toHaveLength(0);
    expect(servicesOn(hours, at("2026-10-20", "12:00")).map((s) => s.kind)).toEqual(["dinner"]);
    expect(servicesOn(hours, at("2026-10-21", "12:00")).map((s) => s.kind)).toEqual([
      "lunch",
      "dinner",
    ]);
  });

  it("riconosce il servizio in corso", () => {
    expect(currentService(hours, at("2026-10-21", "13:00"))?.kind).toBe("lunch");
    expect(currentService(hours, at("2026-10-21", "16:00"))).toBeNull();
    expect(currentService(hours, at("2026-10-21", "14:30"))).toBeNull();
  });

  it("trova la prossima apertura, anche nei giorni successivi", () => {
    const fromMonday = nextOpening(hours, at("2026-10-19", "10:00"));
    expect(fromMonday?.kind).toBe("dinner");
    expect(fromMonday?.date.toISOString()).toBe(at("2026-10-20", "19:00").toISOString());
    expect(nextOpening(hours, at("2026-10-21", "15:00"))?.kind).toBe("dinner");
  });

  it("propone l'orario del prossimo servizio di oggi quando il locale è chiuso", () => {
    expect(upcomingServiceTime(hours, at("2026-10-21", "16:00"))).toBe("20:00");
    expect(upcomingServiceTime(hours, at("2026-10-21", "20:00"))).toBeNull();
    expect(upcomingServiceTime(hours, at("2026-10-19", "12:00"))).toBeNull();
  });
});
