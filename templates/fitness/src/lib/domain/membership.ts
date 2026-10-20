import { addDays, addMonths } from "date-fns";
import { daysBetween, parseISODate, toISODate } from "./dates";
import type { BillingCycle, Cents, ISODate, Member, Plan } from "./types";

/** Abbonamenti, carnet e certificato medico. Funzioni pure, testate. */

export type MembershipStatus = "active" | "expiring" | "expired" | "suspended";
export type CertificateStatus = "valid" | "expiring" | "expired" | "missing" | "not_required";

/** Mesi pagati con l'abbonamento annuale: 12 mesi al prezzo di 10. */
export const ANNUAL_MONTHS_CHARGED = 10;

/**
 * Stato dell'abbonamento in una data.
 * "In scadenza" solo se non si rinnova da solo: chi ha il rinnovo automatico
 * non deve fare nulla. Per i carnet conta anche l'esaurimento degli ingressi.
 */
export function membershipStatus(
  member: Pick<Member, "membershipEnd" | "autoRenew" | "suspended" | "entriesLeft">,
  today: Date,
  reminderDays = 14,
): MembershipStatus {
  if (member.suspended) return "suspended";
  const left = daysBetween(today, member.membershipEnd);
  if (left < 0) return "expired";
  if (member.entriesLeft !== null && member.entriesLeft <= 0) return "expired";
  if (member.entriesLeft !== null && member.entriesLeft <= 2) return "expiring";
  if (!member.autoRenew && left <= reminderDays) return "expiring";
  return "active";
}

/** Giorni alla scadenza (0 = scade oggi, negativo = scaduto). */
export function daysToExpiry(member: Pick<Member, "membershipEnd">, today: Date): number {
  return daysBetween(today, member.membershipEnd);
}

export function certificateStatus(
  expiry: ISODate | null,
  today: Date,
  required: boolean,
  warnDays = 30,
): CertificateStatus {
  if (!required) return "not_required";
  if (!expiry) return "missing";
  const left = daysBetween(today, expiry);
  if (left < 0) return "expired";
  if (left <= warnDays) return "expiring";
  return "valid";
}

/** Prezzo dell'abbonamento annuale (o null se il piano non lo prevede). */
export function annualPrice(plan: Pick<Plan, "billing" | "price">): Cents | null {
  return plan.billing === "monthly" ? plan.price * ANNUAL_MONTHS_CHARGED : null;
}

/** Prezzo mensile equivalente dell'annuale, arrotondato al centesimo. */
export function annualMonthlyEquivalent(plan: Pick<Plan, "billing" | "price">): Cents | null {
  const annual = annualPrice(plan);
  return annual === null ? null : Math.round(annual / 12);
}

/** Importo da pagare per un ciclo di fatturazione. */
export function cyclePrice(plan: Pick<Plan, "billing" | "price">, cycle: BillingCycle): Cents {
  if (cycle === "annual") return annualPrice(plan) ?? plan.price;
  return plan.price;
}

/** Nuovo periodo di validità dopo un rinnovo, a partire dalla scadenza (o da oggi se già scaduto). */
export function renewalPeriod(
  member: Pick<Member, "membershipEnd" | "cycle">,
  plan: Pick<Plan, "validityDays">,
  today: Date,
): { start: ISODate; end: ISODate } {
  const end = parseISODate(member.membershipEnd);
  const base = end.getTime() >= today.getTime() ? addDays(end, 1) : today;
  let next: Date;
  if (member.cycle === "annual") next = addMonths(base, 12);
  else if (member.cycle === "pack") next = addDays(base, plan.validityDays ?? 90);
  else next = addMonths(base, 1);
  return { start: toISODate(base), end: toISODate(addDays(next, -1)) };
}

/** Data del prossimo addebito per chi ha il rinnovo automatico. */
export function nextChargeDate(
  member: Pick<Member, "membershipEnd" | "autoRenew">,
): ISODate | null {
  if (!member.autoRenew) return null;
  return toISODate(addDays(parseISODate(member.membershipEnd), 1));
}
