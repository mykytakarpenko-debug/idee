import { z } from "zod";
import { copy } from "@/content/it";
import { parseEurosToCents } from "@/lib/format";

/**
 * Schemi di validazione dei moduli (sito, area socio e pannello).
 * Riutilizzali lato server quando colleghi un backend: la validazione nel
 * browser migliora l'esperienza, non la sicurezza.
 */

const v = copy.validation;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const text = (max: number) => z.string().trim().min(1, v.required).max(max, v.tooLong(max));
const optionalText = (max: number) => z.string().trim().max(max, v.tooLong(max));
const email = z.string().trim().min(1, v.required).regex(EMAIL_RE, v.email);
const phone = z.string().trim().min(1, v.required).regex(PHONE_RE, v.phone);
const consent = z.boolean().refine((value) => value, v.consent);
const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || DATE_RE.test(value), v.date);

const euros = z
  .string()
  .trim()
  .min(1, v.required)
  .transform((value, ctx) => {
    const cents = parseEurosToCents(value);
    if (Number.isNaN(cents) || cents < 0) {
      ctx.addIssue({ code: "custom", message: v.amount });
      return z.NEVER;
    }
    return cents;
  });

const integer = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const n = Number.parseInt(value, 10);
      if (!/^\d+$/.test(value) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: v.number });
        return z.NEVER;
      }
      return n;
    });

// --- Sito pubblico ----------------------------------------------------------

export const trialFormSchema = z.object({
  interest: z.enum(["forza", "cardio", "mente_corpo", "ritmo", "sala_pesi"]),
  sessionId: z.string(),
  name: text(80),
  email,
  phone,
  adult: z.boolean().refine((value) => value, v.adult),
  privacy: consent,
  marketing: z.boolean(),
});
export type TrialFormValues = z.input<typeof trialFormSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, v.password),
});
export type LoginValues = z.input<typeof loginSchema>;

// --- Area socio ----------------------------------------------------------------

export const profileSchema = z.object({ email, phone });
export type ProfileValues = z.input<typeof profileSchema>;

// --- Pannello -------------------------------------------------------------------

export const memberFormSchema = z.object({
  firstName: text(40),
  lastName: text(40),
  email,
  phone,
  planId: z.string().min(1, v.required),
  cycle: z.enum(["monthly", "annual", "pack"]),
  start: z.string().regex(DATE_RE, v.date),
  medicalCertExpiry: optionalDate,
  autoRenew: z.boolean(),
  marketingConsent: z.boolean(),
  imageConsent: z.boolean(),
  notes: optionalText(300),
});
export type MemberFormValues = z.input<typeof memberFormSchema>;

export const planFormSchema = z
  .object({
    name: text(40),
    description: text(160),
    billing: z.enum(["monthly", "pack"]),
    price: euros,
    entries: z.string().trim(),
    validityDays: z.string().trim(),
    includesGym: z.boolean(),
    includesClasses: z.boolean(),
    featured: z.boolean(),
    perks: optionalText(600),
  })
  .superRefine((data, ctx) => {
    if (data.billing !== "pack") return;
    for (const key of ["entries", "validityDays"] as const) {
      const n = Number.parseInt(data[key], 10);
      if (!/^\d+$/.test(data[key]) || n < 1 || n > 365) {
        ctx.addIssue({ code: "custom", message: v.number, path: [key] });
      }
    }
  });
export type PlanFormValues = z.input<typeof planFormSchema>;

export const infoFormSchema = z.object({
  name: text(60),
  tagline: text(120),
  address: text(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, v.postalCode),
  city: text(60),
  phone,
  email,
  vatNumber: optionalText(20),
});
export type InfoFormValues = z.input<typeof infoFormSchema>;

export const bookingSettingsSchema = z.object({
  windowDays: integer(1, 30),
  cancelHours: integer(0, 72),
  maxDailyBookings: integer(1, 6),
  waitlistEnabled: z.boolean(),
});
export type BookingSettingsValues = z.input<typeof bookingSettingsSchema>;

export const rulesSchema = z.object({
  requireMedicalCert: z.boolean(),
  reminderDays: integer(1, 60),
  trialEnabled: z.boolean(),
});
export type RulesValues = z.input<typeof rulesSchema>;
