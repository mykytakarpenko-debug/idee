import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { formatDate } from "@/lib/format";
import { isoWeekday, timeToMinutes } from "./scheduling";
import type {
  Appointment,
  AppointmentStatus,
  Client,
  DateRange,
  OpeningDay,
  Payment,
  Service,
  StaffMember,
} from "./types";

/**
 * Calcoli per dashboard e report. Funzioni pure: ricevono i dati e "adesso",
 * così sono testabili e riutilizzabili anche lato server.
 */

export type ReportPeriod = "30d" | "90d" | "12m";
export type Bucket = "day" | "week" | "month";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export function inRange(iso: string | null | undefined, range: DateRange): boolean {
  if (!iso) return false;
  const ms = new Date(iso).getTime();
  return ms >= range.start.getTime() && ms < range.end.getTime();
}

/** Periodo corrente, periodo precedente di pari durata e granularità del grafico. */
export function periodRanges(
  period: ReportPeriod,
  now: Date,
): { current: DateRange; previous: DateRange; bucket: Bucket } {
  const tomorrow = addDays(startOfDay(now), 1);
  if (period === "12m") {
    const end = addMonths(startOfMonth(now), 1);
    const start = subMonths(end, 12);
    return {
      current: { start, end },
      previous: { start: subMonths(start, 12), end: start },
      bucket: "month",
    };
  }
  const days = period === "30d" ? 30 : 90;
  const start = subDays(tomorrow, days);
  return {
    current: { start, end: tomorrow },
    previous: { start: subDays(start, days), end: start },
    bucket: period === "30d" ? "day" : "week",
  };
}

/** Variazione relativa; null se il periodo precedente è vuoto (variazione non significativa). */
export function deltaRatio(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

export function paidInRange(payments: readonly Payment[], range: DateRange): Payment[] {
  return payments.filter((payment) => payment.status === "paid" && inRange(payment.paidAt, range));
}

export function revenue(payments: readonly Payment[], range: DateRange): number {
  let total = 0;
  for (const payment of paidInRange(payments, range)) total += payment.amount;
  return total;
}

export function averageTicket(payments: readonly Payment[], range: DateRange): number {
  const paid = paidInRange(payments, range);
  if (paid.length === 0) return 0;
  let total = 0;
  for (const payment of paid) total += payment.amount;
  return Math.round(total / paid.length);
}

export interface SeriesPoint {
  key: string;
  label: string;
  /** Etichetta estesa per tooltip e tabella accessibile. */
  longLabel: string;
  value: number;
}

function bucketKey(date: Date, bucket: Bucket): string {
  if (bucket === "day") return formatDate(date, "inputDate");
  if (bucket === "week") return formatDate(startOfWeek(date, WEEK_OPTIONS), "inputDate");
  return formatDate(date, "inputDate").slice(0, 7);
}

/** Serie temporale degli incassi, con tutti i bucket presenti (anche quelli a zero). */
export function revenueSeries(
  payments: readonly Payment[],
  range: DateRange,
  bucket: Bucket,
): SeriesPoint[] {
  const last = new Date(range.end.getTime() - 1);
  const interval = { start: range.start, end: last };
  const starts =
    bucket === "day"
      ? eachDayOfInterval(interval)
      : bucket === "week"
        ? eachWeekOfInterval(interval, WEEK_OPTIONS)
        : eachMonthOfInterval(interval);

  const points = new Map<string, SeriesPoint>();
  for (const start of starts) {
    const key = bucketKey(start, bucket);
    const label =
      bucket === "month" ? formatDate(start, "monthShort") : formatDate(start, "dayMonth");
    const longLabel =
      bucket === "day"
        ? formatDate(start, "weekdayLong")
        : bucket === "week"
          ? `Settimana dal ${formatDate(start, "dayMonthLong")}`
          : formatDate(start, "monthYear");
    points.set(key, { key, label, longLabel, value: 0 });
  }

  for (const payment of paidInRange(payments, range)) {
    const point = points.get(bucketKey(new Date(payment.paidAt as string), bucket));
    if (point) point.value += payment.amount;
  }
  return [...points.values()];
}

/** Ultime `count` settimane complete o in corso, inclusa quella attuale. */
export function lastWeeksRange(now: Date, count: number): DateRange {
  const end = addWeeks(startOfWeek(now, WEEK_OPTIONS), 1);
  return { start: addWeeks(end, -count), end };
}

export function monthToDate(now: Date): { current: DateRange; previous: DateRange } {
  const start = startOfMonth(now);
  const elapsed = now.getTime() - start.getTime();
  const prevStart = subMonths(start, 1);
  return {
    current: { start, end: new Date(now.getTime() + 1) },
    previous: { start: prevStart, end: new Date(prevStart.getTime() + elapsed + 1) },
  };
}

export function appointmentsInRange(
  appointments: readonly Appointment[],
  range: DateRange,
): Appointment[] {
  return appointments.filter((appointment) => inRange(appointment.start, range));
}

export type StatusCounts = Record<AppointmentStatus, number>;

export function statusCounts(appointments: readonly Appointment[]): StatusCounts {
  const counts: StatusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
  for (const appointment of appointments) counts[appointment.status] += 1;
  return counts;
}

/** Presenze su appuntamenti con esito (completati + non presentati). */
export function attendanceRate(appointments: readonly Appointment[]): number | null {
  const counts = statusCounts(appointments);
  const total = counts.completed + counts.no_show;
  return total === 0 ? null : counts.completed / total;
}

export function newClientsCount(clients: readonly Client[], range: DateRange): number {
  return clients.filter((client) => inRange(client.createdAt, range)).length;
}

export interface RankedItem {
  id: string;
  label: string;
  value: number;
  count: number;
}

/**
 * Ricavi per servizio, dai pagamenti collegati agli appuntamenti.
 * Oltre `limit` voci il resto confluisce in "Altro" (mai colori generati in più).
 */
export function revenueByService(
  payments: readonly Payment[],
  appointments: readonly Appointment[],
  services: readonly Service[],
  range: DateRange,
  limit = 6,
): RankedItem[] {
  const appointmentById = new Map(appointments.map((a) => [a.id, a]));
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const totals = new Map<string, RankedItem>();

  for (const payment of paidInRange(payments, range)) {
    const appointment = payment.appointmentId
      ? appointmentById.get(payment.appointmentId)
      : undefined;
    const service = appointment ? serviceById.get(appointment.serviceId) : undefined;
    const id = service?.id ?? "other";
    const entry = totals.get(id) ?? { id, label: service?.name ?? "Altro", value: 0, count: 0 };
    entry.value += payment.amount;
    entry.count += 1;
    totals.set(id, entry);
  }

  const ranked = [...totals.values()].sort((a, b) => b.value - a.value);
  if (ranked.length <= limit) return ranked;
  const head = ranked.slice(0, limit - 1);
  const rest = ranked.slice(limit - 1);
  head.push({
    id: "other",
    label: "Altro",
    value: rest.reduce((acc, item) => acc + item.value, 0),
    count: rest.reduce((acc, item) => acc + item.count, 0),
  });
  return head;
}

/** Servizi più prenotati (esclusi gli annullati). */
export function servicePopularity(
  appointments: readonly Appointment[],
  services: readonly Service[],
  range: DateRange,
  limit = 5,
): RankedItem[] {
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const totals = new Map<string, RankedItem>();
  for (const appointment of appointmentsInRange(appointments, range)) {
    if (appointment.status === "cancelled") continue;
    const service = serviceById.get(appointment.serviceId);
    if (!service) continue;
    const entry = totals.get(service.id) ?? {
      id: service.id,
      label: service.name,
      value: 0,
      count: 0,
    };
    entry.count += 1;
    entry.value += appointment.price;
    totals.set(service.id, entry);
  }
  return [...totals.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function topClients(
  payments: readonly Payment[],
  appointments: readonly Appointment[],
  clients: readonly Client[],
  range: DateRange,
  limit = 5,
): (RankedItem & { visits: number })[] {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const totals = new Map<string, RankedItem & { visits: number }>();
  for (const payment of paidInRange(payments, range)) {
    const client = clientById.get(payment.clientId);
    const label = client ? `${client.firstName} ${client.lastName}` : "Cliente eliminato";
    const entry = totals.get(payment.clientId) ?? {
      id: payment.clientId,
      label,
      value: 0,
      count: 0,
      visits: 0,
    };
    entry.value += payment.amount;
    entry.count += 1;
    totals.set(payment.clientId, entry);
  }
  for (const appointment of appointmentsInRange(appointments, range)) {
    if (appointment.status !== "completed") continue;
    const entry = totals.get(appointment.clientId);
    if (entry) entry.visits += 1;
  }
  return [...totals.values()].sort((a, b) => b.value - a.value).slice(0, limit);
}

/** Minuti di apertura disponibili nell'intervallo, secondo gli orari settimanali. */
export function openMinutesInRange(hours: readonly OpeningDay[], range: DateRange): number {
  const days = differenceInCalendarDays(range.end, range.start);
  let total = 0;
  for (let i = 0; i < days; i += 1) {
    const day = addDays(range.start, i);
    const opening = hours.find((entry) => entry.day === isoWeekday(day));
    if (opening?.open)
      total += Math.max(0, timeToMinutes(opening.to) - timeToMinutes(opening.from));
  }
  return total;
}

export interface Utilization {
  staff: StaffMember;
  bookedMinutes: number;
  availableMinutes: number;
  ratio: number;
}

/** Occupazione: minuti prenotati (esclusi annullati) sui minuti di apertura. */
export function staffUtilization(
  appointments: readonly Appointment[],
  staff: readonly StaffMember[],
  hours: readonly OpeningDay[],
  range: DateRange,
): Utilization[] {
  const available = openMinutesInRange(hours, range);
  const booked = new Map<string, number>();
  for (const appointment of appointmentsInRange(appointments, range)) {
    if (appointment.status === "cancelled") continue;
    const minutes =
      (new Date(appointment.end).getTime() - new Date(appointment.start).getTime()) / 60_000;
    booked.set(appointment.staffId, (booked.get(appointment.staffId) ?? 0) + minutes);
  }
  return staff
    .filter((member) => member.active)
    .map((member) => {
      const bookedMinutes = booked.get(member.id) ?? 0;
      return {
        staff: member,
        bookedMinutes,
        availableMinutes: available,
        ratio: available === 0 ? 0 : Math.min(1, bookedMinutes / available),
      };
    });
}
