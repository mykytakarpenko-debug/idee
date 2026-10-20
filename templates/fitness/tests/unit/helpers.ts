import { DEMO_SETTINGS, PLANS } from "@/lib/demo/seed";
import { combineDateAndTime } from "@/lib/domain/dates";
import type { Booking, ClassSession, ClubSettings, Member } from "@/lib/domain/types";

/** Mercoledì 21 ottobre 2026 alle 10:00 (ora di Roma, vedi vitest.config.ts). */
export const NOW = combineDateAndTime("2026-10-21", "10:00");
export const at = (date: string, time: string) => combineDateAndTime(date, time);
export const settings: ClubSettings = structuredClone(DEMO_SETTINGS);
export const plan = (id: string) => PLANS.find((p) => p.id === id)!;

export function member(patch: Partial<Member> = {}): Member {
  return {
    id: "m_test",
    code: "RC-9999",
    firstName: "Anna",
    lastName: "Bianchi",
    email: "anna@example.com",
    phone: "+39 333 000 0000",
    joinedAt: "2025-01-10",
    planId: "completo",
    cycle: "monthly",
    membershipStart: "2026-10-05",
    membershipEnd: "2026-11-04",
    autoRenew: true,
    entriesLeft: null,
    suspended: false,
    medicalCertExpiry: "2027-06-30",
    marketingConsent: false,
    imageConsent: false,
    ...patch,
  };
}

export function session(patch: Partial<ClassSession> = {}): ClassSession {
  return {
    id: "s1",
    slotId: null,
    courseId: "yoga",
    instructorId: "i_elena",
    room: "studio",
    start: at("2026-10-22", "19:15").toISOString(),
    durationMin: 60,
    capacity: 2,
    cancelled: false,
    ...patch,
  };
}

let seq = 0;
export function booking(patch: Partial<Booking> = {}): Booking {
  seq += 1;
  return {
    id: `b${seq}`,
    sessionId: "s1",
    memberId: `other${seq}`,
    status: "booked",
    createdAt: new Date(Date.UTC(2026, 9, 20, 8, seq)).toISOString(),
    ...patch,
  };
}
