import { describe, expect, it } from "vitest";
import { createDemoData } from "@/lib/demo/seed";
import { checkOpeningHours, findConflicts } from "@/lib/domain/scheduling";

const now = new Date("2026-10-20T10:30:00");
const data = createDemoData(now);

describe("dati demo", () => {
  it("sono deterministici per la stessa data", () => {
    expect(createDemoData(now)).toEqual(data);
  });

  it("usano solo contatti fittizi", () => {
    for (const client of data.clients) {
      if (client.email) expect(client.email.endsWith("@example.com")).toBe(true);
      expect(client.phone).toMatch(/ 000 /);
    }
  });

  it("rispettano gli orari di apertura", () => {
    for (const appointment of data.appointments) {
      expect(
        checkOpeningHours(
          data.settings.hours,
          new Date(appointment.start),
          new Date(appointment.end),
        ),
      ).toBe("ok");
    }
  });

  it("non sovrappongono appuntamenti dello stesso operatore", () => {
    // Confronto tra appuntamenti consecutivi dello stesso operatore (ordinati per inizio).
    const byStaff = new Map<string, typeof data.appointments>();
    for (const a of data.appointments)
      byStaff.set(a.staffId, [...(byStaff.get(a.staffId) ?? []), a]);
    for (const list of byStaff.values()) {
      const sorted = [...list].sort((x, y) => x.start.localeCompare(y.start));
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i]!.start >= sorted[i - 1]!.end).toBe(true);
      }
    }
    const sample = data.appointments[0]!;
    expect(
      findConflicts(data.appointments, {
        staffId: sample.staffId,
        start: new Date(sample.start),
        end: new Date(sample.end),
        ignoreId: sample.id,
      }),
    ).toEqual([]);
  });

  it("collegano i pagamenti ad appuntamenti e clienti esistenti", () => {
    const appointmentIds = new Set(data.appointments.map((a) => a.id));
    const clientIds = new Set(data.clients.map((c) => c.id));
    for (const payment of data.payments) {
      expect(clientIds.has(payment.clientId)).toBe(true);
      if (payment.appointmentId) expect(appointmentIds.has(payment.appointmentId)).toBe(true);
    }
    expect(new Set(data.payments.map((p) => p.number)).size).toBe(data.payments.length);
  });

  it("includono appuntamenti oggi e un anno di storico", () => {
    const today = data.appointments.filter(
      (a) => new Date(a.start).toDateString() === now.toDateString(),
    );
    expect(today.length).toBeGreaterThan(0);
    const oldest = Math.min(...data.appointments.map((a) => new Date(a.start).getTime()));
    expect((now.getTime() - oldest) / 86_400_000).toBeGreaterThan(360);
  });
});
