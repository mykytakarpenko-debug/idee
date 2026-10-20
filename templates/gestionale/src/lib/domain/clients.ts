import type { Appointment, Client, Payment } from "./types";

export function fullName(client: Pick<Client, "firstName" | "lastName">): string {
  return `${client.firstName} ${client.lastName}`.trim();
}

/** Iniziali per l'avatar: "Giulia Rinaldi" → "GR". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export interface ClientStats {
  totalSpent: number;
  completedVisits: number;
  lastVisit: string | null;
  nextAppointment: Appointment | null;
}

/**
 * Statistiche per cliente calcolate in un unico passaggio sui dati.
 * Restituisce una mappa clientId → statistiche.
 */
export function computeClientStats(
  appointments: readonly Appointment[],
  payments: readonly Payment[],
  now: Date,
): Map<string, ClientStats> {
  const stats = new Map<string, ClientStats>();
  const get = (clientId: string) => {
    let entry = stats.get(clientId);
    if (!entry) {
      entry = { totalSpent: 0, completedVisits: 0, lastVisit: null, nextAppointment: null };
      stats.set(clientId, entry);
    }
    return entry;
  };
  const nowMs = now.getTime();

  for (const appointment of appointments) {
    const entry = get(appointment.clientId);
    const startMs = new Date(appointment.start).getTime();
    if (appointment.status === "completed") {
      entry.completedVisits += 1;
      if (!entry.lastVisit || appointment.start > entry.lastVisit)
        entry.lastVisit = appointment.start;
    } else if (
      startMs >= nowMs &&
      (appointment.status === "confirmed" || appointment.status === "pending") &&
      (!entry.nextAppointment || appointment.start < entry.nextAppointment.start)
    ) {
      entry.nextAppointment = appointment;
    }
  }

  for (const payment of payments) {
    if (payment.status !== "paid") continue;
    get(payment.clientId).totalSpent += payment.amount;
  }

  return stats;
}

/** Elenco di etichette univoche ordinate alfabeticamente. */
export function collectTags(clients: readonly Client[]): string[] {
  const set = new Set<string>();
  for (const client of clients) for (const tag of client.tags) set.add(tag);
  return [...set].sort((a, b) => a.localeCompare(b, "it"));
}

/** "vip, abbonamento ,  " → ["vip", "abbonamento"] senza duplicati. */
export function parseTags(value: string): string[] {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)];
}
