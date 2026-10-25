import { addDays, addWeeks } from "date-fns";
import { invoiceStatus, invoiceTotals } from "./billing";
import { toISODate, weekStart } from "./dates";
import { averageFirstResponse, isOpenStatus, slaCompliance, slaState } from "./tickets";
import type { AuditAction, AuditEvent, Cents, DataSnapshot, ISODate, Ticket } from "./types";

/** Indicatori dell'area amministrativa e filtri del registro. Funzioni pure, testate. */

export interface WeekVolume {
  week: ISODate;
  opened: number;
  resolved: number;
}

/** Ticket aperti e risolti per settimana (lunedì), ultime `weeks` settimane. */
export function ticketsByWeek(tickets: readonly Ticket[], now: Date, weeks: number): WeekVolume[] {
  const first = addWeeks(weekStart(now), -(weeks - 1));
  const rows: WeekVolume[] = Array.from({ length: weeks }, (_, i) => ({
    week: toISODate(addWeeks(first, i)),
    opened: 0,
    resolved: 0,
  }));
  const index = new Map(rows.map((r, i) => [r.week, i]));
  for (const ticket of tickets) {
    const opened = index.get(toISODate(weekStart(new Date(ticket.createdAt))));
    if (opened !== undefined) rows[opened]!.opened += 1;
    if (ticket.resolvedAt) {
      const resolved = index.get(toISODate(weekStart(new Date(ticket.resolvedAt))));
      if (resolved !== undefined) rows[resolved]!.resolved += 1;
    }
  }
  return rows;
}

export interface AdminKpis {
  openTickets: number;
  breached: number;
  atRisk: number;
  slaCompliance: number | null;
  averageFirstResponse: number | null;
  overdue: Cents;
  activeProjects: number;
  projectsAtRisk: number;
  activeUsers: number;
}

export function adminKpis(data: DataSnapshot, now: Date, days = 30): AdminKpis {
  const today = toISODate(now);
  const since = addDays(now, -days).getTime();
  const recent = data.tickets.filter((t) => new Date(t.createdAt).getTime() >= since);
  const open = data.tickets.filter((t) => isOpenStatus(t.status));
  const sla = data.settings.slaHours;
  const overdue = data.invoices
    .filter((i) => invoiceStatus(i, today) === "overdue")
    .reduce((acc, i) => acc + invoiceTotals(i).gross, 0);
  const active = data.projects.filter((p) => p.status === "active");
  return {
    openTickets: open.length,
    breached: open.filter((t) => slaState(t, sla, now) === "breached").length,
    atRisk: open.filter((t) => slaState(t, sla, now) === "at_risk").length,
    slaCompliance: slaCompliance(recent, sla),
    averageFirstResponse: averageFirstResponse(recent),
    overdue,
    activeProjects: active.length,
    projectsAtRisk: active.filter((p) => p.health !== "on_track").length,
    activeUsers: data.users.filter(
      (u) => u.status === "active" && u.lastLoginAt && new Date(u.lastLoginAt).getTime() >= since,
    ).length,
  };
}

export interface AuditFilters {
  q: string;
  action: AuditAction | "";
  orgId: string;
  actorId: string;
}

/** Filtra il registro (più recenti prima). `names` risolve gli attori per la ricerca. */
export function filterAudit(
  events: readonly AuditEvent[],
  filters: AuditFilters,
  names: ReadonlyMap<string, string>,
): AuditEvent[] {
  const q = filters.q.trim().toLowerCase();
  return events
    .filter((e) => !filters.action || e.action === filters.action)
    .filter((e) => !filters.orgId || e.orgId === filters.orgId)
    .filter((e) => !filters.actorId || e.actorId === filters.actorId)
    .filter((e) => !q || `${e.target} ${names.get(e.actorId) ?? ""}`.toLowerCase().includes(q))
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** Eventi più vecchi della conservazione prevista, da eliminare. */
export function expiredAudit(
  events: readonly AuditEvent[],
  now: Date,
  retentionDays: number,
): AuditEvent[] {
  const limit = addDays(now, -retentionDays).getTime();
  return events.filter((e) => new Date(e.at).getTime() < limit);
}
