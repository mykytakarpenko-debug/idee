import { z } from "zod";
import { copy } from "@/content/it";

/**
 * Schemi di validazione dei moduli. Riutilizzali lato server: la validazione
 * nel browser migliora l'esperienza, non la sicurezza.
 */

const v = copy.validation;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (max: number) => z.string().trim().min(1, v.required).max(max, v.tooLong(max));
const email = z.string().trim().min(1, v.required).regex(EMAIL_RE, v.email);

const integer = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const n = Number.parseInt(value, 10);
      if (!/^\d+$/.test(value) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: v.number(min, max) });
        return z.NEVER;
      }
      return n;
    });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, v.required),
});
export type LoginValues = z.input<typeof loginSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => /^\d{6}$/.test(value), v.otp),
});

export const ticketSchema = z.object({
  subject: text(120),
  category: z.enum(["bug", "request", "question", "billing"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  body: text(4000),
});
export type TicketValues = z.input<typeof ticketSchema>;

export const replySchema = z.object({
  body: text(4000),
  internal: z.boolean(),
});
export type ReplyValues = z.input<typeof replySchema>;

export const inviteSchema = z.object({
  name: text(80),
  email,
  title: z.string().trim().max(80, v.tooLong(80)),
  role: z.enum(["client_admin", "client_member", "client_viewer", "support", "admin"]),
});
export type InviteValues = z.input<typeof inviteSchema>;

export const uploadSchema = z.object({
  name: text(120).refine((value) => !/[\\/:*?"<>|]/.test(value), v.fileName),
  folder: z.enum(["contratti", "consegne", "report", "amministrazione"]),
  projectId: z.string(),
});
export type UploadValues = z.input<typeof uploadSchema>;

export const settingsSchema = z.object({
  providerName: text(60),
  supportEmail: email,
  urgent: integer(1, 72),
  high: integer(1, 120),
  normal: integer(1, 240),
  low: integer(1, 480),
  sessionTimeoutMinutes: integer(5, 480),
  auditRetentionDays: integer(30, 3650),
  mfaRequired: z.boolean(),
});
export type SettingsValues = z.input<typeof settingsSchema>;
