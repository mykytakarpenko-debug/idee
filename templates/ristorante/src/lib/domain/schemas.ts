import { z } from "zod";
import { copy } from "@/content/it";
import { parseEurosToCents } from "@/lib/format";
import { ALLERGENS } from "./types";

/**
 * Schemi di validazione dei moduli (sito e pannello).
 * Riutilizzali lato server quando colleghi un backend: la validazione nel
 * browser migliora l'esperienza, non la sicurezza.
 */

const v = copy.validation;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const text = (max: number) => z.string().trim().min(1, v.required).max(max, v.tooLong(max));
const optionalText = (max: number) => z.string().trim().max(max, v.tooLong(max));
const email = z.string().trim().min(1, v.required).regex(EMAIL_RE, v.email);
const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === "" || EMAIL_RE.test(value), v.email);
const phone = z.string().trim().min(1, v.required).regex(PHONE_RE, v.phone);
const consent = z.boolean().refine((value) => value, v.consent);

const euros = z
  .string()
  .trim()
  .min(1, v.required)
  .transform((value, ctx) => {
    const cents = parseEurosToCents(value);
    if (Number.isNaN(cents)) {
      ctx.addIssue({ code: "custom", message: v.amount });
      return z.NEVER;
    }
    return cents;
  });

const integer = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const n = Number.parseInt(value, 10);
      if (!/^\d+$/.test(value) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return n;
    });

// --- Sito pubblico ----------------------------------------------------------

export const bookingFormSchema = z.object({
  name: text(80),
  phone,
  email,
  notes: optionalText(300),
  privacy: consent,
  marketing: z.boolean(),
});
export type BookingFormValues = z.input<typeof bookingFormSchema>;

export const checkoutFormSchema = z
  .object({
    type: z.enum(["delivery", "takeaway"]),
    when: z.enum(["asap", "scheduled"]),
    scheduledTime: z.string(),
    street: optionalText(120),
    postalCode: z.string().trim(),
    city: optionalText(60),
    addressNotes: optionalText(160),
    name: text(80),
    phone,
    email,
    payment: z.enum(["cash", "card_on_delivery", "online"]),
    notes: optionalText(300),
    privacy: consent,
  })
  .superRefine((data, ctx) => {
    if (data.when === "scheduled" && !TIME_RE.test(data.scheduledTime)) {
      ctx.addIssue({ code: "custom", message: v.time, path: ["scheduledTime"] });
    }
    if (data.type === "delivery") {
      if (!data.street) ctx.addIssue({ code: "custom", message: v.required, path: ["street"] });
      if (!/^\d{5}$/.test(data.postalCode))
        ctx.addIssue({ code: "custom", message: v.postalCode, path: ["postalCode"] });
      if (!data.city) ctx.addIssue({ code: "custom", message: v.required, path: ["city"] });
    }
  });
export type CheckoutFormValues = z.input<typeof checkoutFormSchema>;

// --- Pannello ----------------------------------------------------------------

export const reservationFormSchema = z.object({
  name: text(80),
  phone,
  email: optionalEmail,
  partySize: integer(1, 30, v.party(30)),
  date: z.string().regex(DATE_RE, v.required),
  time: z.string().regex(TIME_RE, v.time),
  tableId: z.string(),
  source: z.enum(["online", "phone", "walk_in"]),
  notes: optionalText(300),
});
export type ReservationFormValues = z.input<typeof reservationFormSchema>;

export const dishFormSchema = z.object({
  name: text(80),
  description: optionalText(240),
  categoryId: z.string().min(1, v.required),
  price: euros,
  allergens: z.array(z.enum(ALLERGENS)),
  vegetarian: z.boolean(),
  vegan: z.boolean(),
  spicy: z.boolean(),
  orderable: z.boolean(),
  featured: z.boolean(),
});
export type DishFormValues = z.input<typeof dishFormSchema>;

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
  enabled: z.boolean(),
  slotMinutes: z.enum(["15", "30"]),
  durationMin: integer(30, 300, v.number),
  maxPartySize: integer(1, 30, v.number),
  leadTimeMin: integer(0, 1440, v.number),
  lastSeatingBeforeCloseMin: integer(0, 240, v.number),
});
export type BookingSettingsValues = z.input<typeof bookingSettingsSchema>;

export const deliverySettingsSchema = z.object({
  enabled: z.boolean(),
  takeawayEnabled: z.boolean(),
  minOrder: euros,
  fee: euros,
  freeAbove: euros,
  prepMinutes: integer(5, 180, v.number),
  deliveryMinutes: integer(0, 180, v.number),
  postalCodes: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const codes = [...new Set(value.split(/[\s,;]+/).filter(Boolean))];
      if (codes.some((code) => !/^\d{5}$/.test(code))) {
        ctx.addIssue({ code: "custom", message: v.postalCode });
        return z.NEVER;
      }
      return codes;
    }),
});
export type DeliverySettingsValues = z.input<typeof deliverySettingsSchema>;
