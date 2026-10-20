import { DEMO_SETTINGS, HOURS, SERVICES } from "@/lib/demo/seed";
import type { SlotQuery } from "@/lib/domain/availability";
import { combineDateAndTime } from "@/lib/domain/dates";
import type { Appointment, BusinessSettings, Service } from "@/lib/domain/types";

/** Mercoledì 21 ottobre 2026 alle 10:00 (ora di Roma, vedi vitest.config.ts). */
export const NOW = combineDateAndTime("2026-10-21", "10:00");
export const at = (date: string, time: string) => combineDateAndTime(date, time);

export const booking = (
  patch: Partial<BusinessSettings["booking"]> = {},
): BusinessSettings["booking"] => ({ ...structuredClone(DEMO_SETTINGS.booking), ...patch });

export const service = (id: string, patch: Partial<Service> = {}): Service => ({
  ...structuredClone(SERVICES.find((s) => s.id === id)!),
  ...patch,
});

let seq = 0;
/** Appuntamento di prova: start/end in ora locale ("2026-10-22", "10:00", minuti). */
export function appointment(
  date: string,
  time: string,
  durationMin: number,
  patch: Partial<Appointment> = {},
): Appointment {
  seq += 1;
  const start = at(date, time);
  return {
    id: `ap_t${seq}`,
    code: `AG-TEST${String(seq).padStart(2, "0")}`.slice(0, 9),
    serviceId: "730",
    staffId: "s_laura",
    mode: "in_person",
    start: start.toISOString(),
    end: new Date(start.getTime() + durationMin * 60_000).toISOString(),
    status: "confirmed",
    customer: { name: "Anna Bianchi", email: "anna@example.com", phone: "+39 333 000 0000" },
    marketingConsent: false,
    source: "online",
    createdAt: at("2026-10-15", "09:00").toISOString(),
    history: [],
    ...patch,
  };
}

/** Query di disponibilità con i dati statici della demo e nessun appuntamento. */
export function query(patch: Partial<SlotQuery> & Pick<SlotQuery, "service" | "date">): SlotQuery {
  return {
    staffId: "any",
    data: { services: SERVICES, hours: HOURS, timeOff: [], appointments: [] },
    booking: booking(),
    now: NOW,
    ...patch,
  };
}

/** Orari "HH:mm" di una lista di date (per confronti leggibili). */
export const times = (dates: readonly Date[]) =>
  dates.map(
    (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  );
