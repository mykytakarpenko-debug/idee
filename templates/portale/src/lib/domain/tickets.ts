import type {
  PortalSettings,
  Role,
  Ticket,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from "./types";
import { can } from "./rbac";

/** Ticket: SLA di prima risposta, transizioni di stato, visibilità dei messaggi. */

export type SlaState = "met" | "breached" | "at_risk" | "on_time";

export function slaDeadline(
  ticket: Pick<Ticket, "createdAt" | "priority">,
  slaHours: PortalSettings["slaHours"],
): Date {
  return new Date(new Date(ticket.createdAt).getTime() + slaHours[ticket.priority] * 3_600_000);
}

/**
 * Stato dello SLA di prima risposta:
 * - met/breached se la risposta c'è (entro o oltre la scadenza);
 * - senza risposta: breached se scaduto, at_risk nell'ultimo quarto del tempo, altrimenti on_time.
 */
export function slaState(
  ticket: Pick<Ticket, "createdAt" | "priority" | "firstResponseAt" | "status">,
  slaHours: PortalSettings["slaHours"],
  now: Date,
): SlaState {
  const deadline = slaDeadline(ticket, slaHours).getTime();
  if (ticket.firstResponseAt) {
    return new Date(ticket.firstResponseAt).getTime() <= deadline ? "met" : "breached";
  }
  if (ticket.status === "closed" || ticket.status === "resolved") return "met";
  const total = slaHours[ticket.priority] * 3_600_000;
  const left = deadline - now.getTime();
  if (left < 0) return "breached";
  if (left <= total / 4) return "at_risk";
  return "on_time";
}

/** Quota di ticket con prima risposta entro lo SLA (null se nessun ticket valutabile). */
export function slaCompliance(
  tickets: readonly Ticket[],
  slaHours: PortalSettings["slaHours"],
): number | null {
  const answered = tickets.filter((t) => t.firstResponseAt !== null);
  if (answered.length === 0) return null;
  const met = answered.filter((t) => slaState(t, slaHours, new Date(0)) === "met").length;
  return met / answered.length;
}

/** Tempo medio di prima risposta in minuti. */
export function averageFirstResponse(tickets: readonly Ticket[]): number | null {
  const times = tickets
    .filter((t) => t.firstResponseAt !== null)
    .map(
      (t) => (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime()) / 60_000,
    );
  if (times.length === 0) return null;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress", "waiting", "resolved", "closed"],
  in_progress: ["waiting", "resolved", "closed"],
  waiting: ["in_progress", "resolved", "closed"],
  resolved: ["closed", "in_progress"],
  closed: [],
};

/** Stati raggiungibili. Il cliente può solo chiudere un ticket risolto o riaprirlo. */
export function nextStatuses(status: TicketStatus, role: Role): TicketStatus[] {
  if (can(role, "tickets.manage")) return TRANSITIONS[status];
  if (status === "resolved") return ["closed", "in_progress"];
  return [];
}

export function isOpenStatus(status: TicketStatus): boolean {
  return status === "open" || status === "in_progress" || status === "waiting";
}

/** Messaggi visibili: le note interne solo a chi ha il permesso. */
export function visibleMessages(messages: readonly TicketMessage[], role: Role): TicketMessage[] {
  return can(role, "tickets.internal") ? [...messages] : messages.filter((m) => !m.internal);
}

export function ticketNumber(sequence: number): string {
  return `T-${1000 + sequence}`;
}

/** Ordine della coda: SLA più a rischio, poi priorità, poi anzianità. */
export function queueOrder(
  tickets: readonly Ticket[],
  slaHours: PortalSettings["slaHours"],
  now: Date,
): Ticket[] {
  const sla: Record<SlaState, number> = { breached: 0, at_risk: 1, on_time: 2, met: 3 };
  const priority: Record<TicketPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  return [...tickets].sort(
    (a, b) =>
      Number(!isOpenStatus(a.status)) - Number(!isOpenStatus(b.status)) ||
      sla[slaState(a, slaHours, now)] - sla[slaState(b, slaHours, now)] ||
      priority[a.priority] - priority[b.priority] ||
      a.createdAt.localeCompare(b.createdAt),
  );
}
