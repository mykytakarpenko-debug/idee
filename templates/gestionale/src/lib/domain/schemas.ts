import { z } from "zod";
import { copy } from "@/content/it";
import { parseEurosToCents } from "@/lib/format";

/**
 * Schemi di validazione dei moduli.
 *
 * Ricevono i valori così come arrivano dai campi (stringhe e booleani) e li
 * trasformano nei tipi di dominio. Gli stessi schemi vanno riusati lato server
 * (Server Actions / API) quando il template viene collegato a un backend:
 * la validazione nel browser migliora l'esperienza, non la sicurezza.
 */

const v = copy.validation;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const requiredText = (max: number) => z.string().trim().min(1, v.required).max(max, v.tooLong(max));

const optionalText = (max: number) => z.string().trim().max(max, v.tooLong(max));

const optionalEmail = z
  .string()
  .trim()
  .max(120, v.tooLong(120))
  .refine((value) => value === "" || EMAIL_RE.test(value), v.email);

const requiredEmail = z.string().trim().min(1, v.required).regex(EMAIL_RE, v.email);

const phone = z.string().trim().min(1, v.required).regex(PHONE_RE, v.phone);

const optionalPhone = z
  .string()
  .trim()
  .refine((value) => value === "" || PHONE_RE.test(value), v.phone);

/** Importo in euro digitato dall'utente → centesimi. */
const euros = ({ allowZero }: { allowZero: boolean }) =>
  z
    .string()
    .trim()
    .min(1, v.required)
    .transform((value, ctx) => {
      const cents = parseEurosToCents(value);
      if (Number.isNaN(cents)) {
        ctx.addIssue({ code: "custom", message: v.amount });
        return z.NEVER;
      }
      if (!allowZero && cents <= 0) {
        ctx.addIssue({ code: "custom", message: v.positive });
        return z.NEVER;
      }
      return cents;
    });

const durationMinutes = z
  .string()
  .trim()
  .min(1, v.required)
  .transform((value, ctx) => {
    const minutes = Number.parseInt(value, 10);
    if (!/^\d+$/.test(value) || minutes < 5 || minutes > 600) {
      ctx.addIssue({ code: "custom", message: v.duration });
      return z.NEVER;
    }
    return minutes;
  });

const date = z.string().trim().min(1, v.required).regex(DATE_RE, v.date);
const time = z.string().trim().min(1, v.required).regex(TIME_RE, v.time);

// ---------------------------------------------------------------------------

export const clientFormSchema = z.object({
  firstName: requiredText(60),
  lastName: requiredText(60),
  email: optionalEmail,
  phone,
  company: optionalText(80),
  city: optionalText(60),
  status: z.enum(["active", "lead", "inactive"]),
  tags: optionalText(200),
  notes: optionalText(1000),
  marketingConsent: z.boolean(),
});
export type ClientFormValues = z.input<typeof clientFormSchema>;
export type ClientFormData = z.output<typeof clientFormSchema>;

export const serviceFormSchema = z.object({
  name: requiredText(80),
  category: requiredText(40),
  durationMin: durationMinutes,
  price: euros({ allowZero: true }),
  description: optionalText(300),
  active: z.boolean(),
});
export type ServiceFormValues = z.input<typeof serviceFormSchema>;
export type ServiceFormData = z.output<typeof serviceFormSchema>;

export const appointmentFormSchema = z.object({
  clientId: z.string().min(1, v.required),
  serviceId: z.string().min(1, v.required),
  staffId: z.string().min(1, v.required),
  date,
  time,
  durationMin: durationMinutes,
  price: euros({ allowZero: true }),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  channel: z.enum(["online", "phone", "walk_in", "staff"]),
  notes: optionalText(500),
});
export type AppointmentFormValues = z.input<typeof appointmentFormSchema>;
export type AppointmentFormData = z.output<typeof appointmentFormSchema>;

export const paymentFormSchema = z
  .object({
    clientId: z.string().min(1, v.required),
    appointmentId: z.string(),
    description: requiredText(140),
    amount: euros({ allowZero: false }),
    method: z.enum(["card", "cash", "transfer", "voucher"]),
    status: z.enum(["paid", "pending", "refunded"]),
    issuedAt: date,
    dueAt: date,
    notes: optionalText(500),
  })
  .refine((data) => data.dueAt >= data.issuedAt, {
    message: v.dueBeforeIssue,
    path: ["dueAt"],
  });
export type PaymentFormValues = z.input<typeof paymentFormSchema>;
export type PaymentFormData = z.output<typeof paymentFormSchema>;

export const staffFormSchema = z.object({
  name: requiredText(80),
  role: requiredText(60),
  email: optionalEmail,
  color: z.enum(["1", "2", "3", "4", "5", "6", "7", "8"]),
  active: z.boolean(),
});
export type StaffFormValues = z.input<typeof staffFormSchema>;
export type StaffFormData = z.output<typeof staffFormSchema>;

export const businessFormSchema = z.object({
  name: requiredText(80),
  legalName: optionalText(120),
  vatNumber: z
    .string()
    .trim()
    .refine((value) => value === "" || /^(IT)?\d{11}$/.test(value.replace(/\s/g, "")), v.vat),
  email: optionalEmail,
  phone: optionalPhone,
  address: optionalText(120),
  city: optionalText(60),
  ownerName: requiredText(80),
  paymentTermsDays: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, v.required)
    .transform((value) => Number.parseInt(value, 10)),
});
export type BusinessFormValues = z.input<typeof businessFormSchema>;
export type BusinessFormData = z.output<typeof businessFormSchema>;

export const loginFormSchema = z.object({
  email: requiredEmail,
  password: z.string().min(8, copy.auth.passwordMin),
  remember: z.boolean(),
});
export type LoginFormValues = z.input<typeof loginFormSchema>;
