import { z } from "zod";
import { copy } from "@/content/it";
import { parseEurosToCents } from "@/lib/format";
import { fiscalCodeMatchesBirthDate, isAdult, isValidFiscalCode, normalizeFiscalCode } from "./kyc";

/**
 * Schemi di validazione dei moduli. Riutilizzali lato server: la validazione
 * nel browser migliora l'esperienza, non la sicurezza.
 */

const v = copy.validation;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (max: number) => z.string().trim().min(1, v.required).max(max, v.tooLong(max));
const email = z.string().trim().min(1, v.required).regex(EMAIL_RE, v.email);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, v.date);

/** Importo in euro ("50", "12,50") → centesimi, entro un intervallo. */
export const amount = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const cents = parseEurosToCents(value);
      if (!value || !Number.isFinite(cents) || cents < min || cents > max) {
        ctx.addIssue({ code: "custom", message: v.amount(min / 100, max / 100) });
        return z.NEVER;
      }
      return cents;
    });

/** Limite facoltativo: vuoto = nessun limite. */
const optionalAmount = (max: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (!value) return null;
      const cents = parseEurosToCents(value);
      if (!Number.isFinite(cents) || cents < 100 || cents > max) {
        ctx.addIssue({ code: "custom", message: v.amount(1, max / 100) });
        return z.NEVER;
      }
      return cents;
    });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, v.required),
});

/** `today` restituisce la data odierna al momento della validazione (maggiore età, scadenza). */
export function registrationSchema(today: () => string) {
  return z
    .object({
      firstName: text(60),
      lastName: text(60),
      birthDate: isoDate.refine((d) => isAdult(d, today()), v.adult),
      fiscalCode: z
        .string()
        .transform(normalizeFiscalCode)
        .refine((cf) => cf.length > 0, v.required)
        .refine(isValidFiscalCode, v.fiscalCode),
      city: text(80),
      email,
      password: z.string().min(10, v.password),
      documentType: z.enum(["carta_identita", "patente", "passaporto"]),
      documentNumber: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9]{5,12}$/, v.document),
      documentExpiresOn: isoDate.refine((d) => d > today(), v.documentExpired),
      depositWeek: amount(1_000, 100_000),
      terms: z.boolean().refine((value) => value, v.terms),
      privacy: z.boolean().refine((value) => value, v.privacy),
    })
    .refine((data) => fiscalCodeMatchesBirthDate(data.fiscalCode, data.birthDate), {
      path: ["fiscalCode"],
      message: v.fiscalCodeBirth,
    });
}

export const limitsSchema = z.object({
  depositDay: optionalAmount(100_000),
  depositWeek: amount(1_000, 100_000),
  depositMonth: optionalAmount(300_000),
  lossDay: optionalAmount(100_000),
  sessionMinutes: z.enum(["", "30", "60", "120", "240"]).transform((m) => (m ? Number(m) : null)),
  realityCheckMinutes: z.enum(["15", "30", "60"]).transform(Number),
});

export const depositSchema = z.object({ amount: amount(1_000, 50_000) });
export const withdrawalSchema = z.object({ amount: amount(1_000, 1_000_000) });
