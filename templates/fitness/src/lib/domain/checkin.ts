import { toISODate } from "./dates";
import { certificateStatus, membershipStatus } from "./membership";
import type { CheckIn, ClubSettings, Member, Plan } from "./types";

/** Controlli all'ingresso in reception. Funzioni pure, testate. */

export type CheckInBlock =
  "suspended" | "expired" | "no_entries" | "certificate_expired" | "certificate_missing";
export type CheckInWarning =
  "membership_expiring" | "certificate_expiring" | "already_today" | "last_entry";

export interface CheckInResult {
  ok: boolean;
  blocks: CheckInBlock[];
  warnings: CheckInWarning[];
}

export function checkInEligibility(
  member: Member,
  plan: Plan | undefined,
  checkIns: readonly CheckIn[],
  settings: Pick<ClubSettings, "reminderDays" | "requireMedicalCert">,
  now: Date,
): CheckInResult {
  const blocks: CheckInBlock[] = [];
  const warnings: CheckInWarning[] = [];

  const status = membershipStatus(member, now, settings.reminderDays);
  if (status === "suspended") blocks.push("suspended");
  else if (member.entriesLeft !== null && member.entriesLeft <= 0) blocks.push("no_entries");
  else if (status === "expired") blocks.push("expired");
  else if (status === "expiring") warnings.push("membership_expiring");

  if (member.entriesLeft === 1) warnings.push("last_entry");

  const cert = certificateStatus(member.medicalCertExpiry, now, settings.requireMedicalCert);
  if (cert === "expired") blocks.push("certificate_expired");
  else if (cert === "missing") blocks.push("certificate_missing");
  else if (cert === "expiring") warnings.push("certificate_expiring");

  const today = toISODate(now);
  if (checkIns.some((c) => c.memberId === member.id && toISODate(new Date(c.at)) === today)) {
    warnings.push("already_today");
  }

  // Un piano senza sala pesi né corsi non dà accesso (caso limite di configurazione).
  if (plan && !plan.includesGym && !plan.includesClasses) blocks.push("expired");

  return { ok: blocks.length === 0, blocks, warnings };
}
