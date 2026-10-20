import { describe, expect, it } from "vitest";
import {
  attendanceRate,
  deltaRatio,
  openMinutesInRange,
  periodRanges,
  revenue,
  revenueByService,
  revenueSeries,
  staffUtilization,
} from "@/lib/domain/analytics";
import type { Appointment, OpeningDay, Payment, Service, StaffMember } from "@/lib/domain/types";

const now = new Date("2026-10-20T10:00:00");

const paid = (
  id: string,
  paidAt: string,
  amount: number,
  appointmentId: string | null = null,
): Payment => ({
  id,
  number: `2026/${id}`,
  clientId: "cl_1",
  appointmentId,
  description: "x",
  amount,
  method: "card",
  status: "paid",
  issuedAt: paidAt,
  dueAt: paidAt,
  paidAt,
});

const appt = (
  id: string,
  serviceId: string,
  status: Appointment["status"] = "completed",
): Appointment => ({
  id,
  clientId: "cl_1",
  serviceId,
  staffId: "st_1",
  start: new Date("2026-10-19T09:00:00").toISOString(),
  end: new Date("2026-10-19T10:00:00").toISOString(),
  status,
  price: 1000,
  channel: "staff",
});

describe("periodi dei report", () => {
  it("confronta periodi di pari durata", () => {
    const { current, previous, bucket } = periodRanges("30d", now);
    const days = (r: { start: Date; end: Date }) =>
      Math.round((r.end.getTime() - r.start.getTime()) / 86_400_000);
    expect(days(current)).toBe(30);
    expect(days(previous)).toBe(30);
    expect(previous.end.getTime()).toBe(current.start.getTime());
    expect(bucket).toBe("day");
    expect(periodRanges("12m", now).bucket).toBe("month");
  });

  it("restituisce null quando il periodo precedente è vuoto", () => {
    expect(deltaRatio(100, 0)).toBeNull();
    expect(deltaRatio(110, 100)).toBeCloseTo(0.1);
  });
});

describe("ricavi", () => {
  const payments = [
    paid("1", new Date("2026-10-19T12:00:00").toISOString(), 4500, "a1"),
    paid("2", new Date("2026-10-18T12:00:00").toISOString(), 2000, "a2"),
    paid("3", new Date("2026-08-01T12:00:00").toISOString(), 9999),
    {
      ...paid("4", new Date("2026-10-19T12:00:00").toISOString(), 7000),
      status: "refunded" as const,
    },
  ];

  it("somma solo i pagamenti incassati nel periodo", () => {
    expect(revenue(payments, periodRanges("30d", now).current)).toBe(6500);
  });

  it("crea una serie completa con i bucket vuoti", () => {
    const series = revenueSeries(payments, periodRanges("30d", now).current, "day");
    expect(series).toHaveLength(30);
    expect(series.reduce((acc, point) => acc + point.value, 0)).toBe(6500);
  });

  it("raggruppa i ricavi per servizio e accorpa il resto in Altro", () => {
    const services: Service[] = ["s1", "s2", "s3"].map((id) => ({
      id,
      name: id.toUpperCase(),
      category: "C",
      durationMin: 30,
      price: 1000,
      active: true,
      createdAt: now.toISOString(),
    }));
    const appointments = [appt("a1", "s1"), appt("a2", "s2"), appt("a3", "s3")];
    const list = [
      paid("1", now.toISOString(), 5000, "a1"),
      paid("2", now.toISOString(), 3000, "a2"),
      paid("3", now.toISOString(), 1000, "a3"),
    ];
    const ranked = revenueByService(
      list,
      appointments,
      services,
      periodRanges("30d", now).current,
      2,
    );
    expect(ranked.map((r) => [r.label, r.value])).toEqual([
      ["S1", 5000],
      ["Altro", 4000],
    ]);
  });
});

describe("indicatori operativi", () => {
  it("calcola il tasso di presenza sugli appuntamenti con esito", () => {
    expect(
      attendanceRate([
        appt("1", "s"),
        appt("2", "s"),
        appt("3", "s", "no_show"),
        appt("4", "s", "cancelled"),
      ]),
    ).toBeCloseTo(2 / 3);
    expect(attendanceRate([appt("1", "s", "confirmed")])).toBeNull();
  });

  it("misura l'occupazione sui minuti di apertura", () => {
    const hours: OpeningDay[] = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
      day: day as OpeningDay["day"],
      open: day === 1,
      from: "09:00",
      to: "11:00",
    }));
    const range = { start: new Date("2026-10-19T00:00:00"), end: new Date("2026-10-20T00:00:00") };
    expect(openMinutesInRange(hours, range)).toBe(120);
    const staff: StaffMember[] = [
      { id: "st_1", name: "A", role: "", email: "", color: 1, active: true },
    ];
    const [item] = staffUtilization([appt("1", "s")], staff, hours, range);
    expect(item?.ratio).toBeCloseTo(0.5);
  });
});
