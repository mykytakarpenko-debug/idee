import { z } from "zod";
import { copy } from "@/content/it";
import { parseEurosToCents } from "@/lib/format";

/**
 * Schemi di validazione dei moduli (pagina pubblica, widget e pannello).
 * Riutilizzali lato server: la validazione nel browser migliora l'esperienza,
 * non la sicurezza.
 */

const v = copy.validation;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

const text = (max: number) => z.string().trim().min(1, v.required).max(max, v.tooLong(max));
const optionalText = (max: number) => z.string().trim().max(max, v.tooLong(max));
const email = z.string().trim().min(1, v.required).regex(EMAIL_RE, v.email);
const phone = z.string().trim().min(1, v.required).regex(PHONE_RE, v.phone);

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

export const detailsSchema = z.object({
  name: text(80),
  email,
  phone,
  notes: optionalText(400),
  privacy: z.boolean().refine((value) => value, v.consent),
  marketing: z.boolean(),
});
export type DetailsValues = z.input<typeof detailsSchema>;

/** Codice prenotazione: accetta minuscole e spazi, restituisce "AG-XXXXXX". */
export const codeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase().replace(/\s+/g, ""))
  .refine((value) => /^AG-[A-Z0-9]{6}$/.test(value), v.code);

export const serviceFormSchema = z.object({
  name: text(60),
  description: text(200),
  categoryId: z.string().min(1, v.required),
  durationMin: integer(10, 480),
  bufferMin: integer(0, 120),
  price: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const cents = parseEurosToCents(value);
      if (Number.isNaN(cents) || cents < 0) {
        ctx.addIssue({ code: "custom", message: v.amount });
        return z.NEVER;
      }
      return cents;
    }),
  modes: z.array(z.enum(["in_person", "online"])).min(1, v.atLeastOne),
  staffIds: z.array(z.string()).min(1, v.atLeastOne),
  requiresApproval: z.boolean(),
});
export type ServiceFormValues = z.input<typeof serviceFormSchema>;

export const infoFormSchema = z.object({
  name: text(60),
  tagline: text(140),
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

export const bookingRulesSchema = z.object({
  slotStepMin: z.enum(["15", "30", "60"]),
  leadTimeHours: integer(0, 168),
  horizonDays: integer(1, 365),
  cancelHours: integer(0, 168),
  allowAnyStaff: z.boolean(),
});
export type BookingRulesValues = z.input<typeof bookingRulesSchema>;
