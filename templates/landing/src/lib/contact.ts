import { z } from "zod";

/**
 * Modulo contatti: schema condiviso tra browser e server, filtri antispam
 * (campo nascosto e tempo minimo di compilazione) e limite di frequenza.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const TEAM_SIZES = ["1-5", "6-20", "21-50", "50+"] as const;

export const messages = {
  required: "Campo obbligatorio",
  email: "Inserisci un indirizzo email valido",
  tooLong: (max: number) => `Massimo ${max} caratteri`,
  tooShort: (min: number) => `Scrivi almeno ${min} caratteri`,
};

const text = (max: number) =>
  z.string().trim().min(1, messages.required).max(max, messages.tooLong(max));

export const contactSchema = z.object({
  name: text(80),
  email: z
    .string()
    .trim()
    .min(1, messages.required)
    .regex(EMAIL_RE, messages.email)
    .max(120, messages.tooLong(120)),
  company: z.string().trim().max(120, messages.tooLong(120)),
  teamSize: z.enum(TEAM_SIZES),
  message: z.string().trim().min(10, messages.tooShort(10)).max(2000, messages.tooLong(2000)),
  newsletter: z.boolean(),
});

export type ContactInput = z.input<typeof contactSchema>;

/** Campo trappola: invisibile alle persone, compilato dai bot. */
export const HONEYPOT_FIELD = "website";
/** Sotto questo tempo di compilazione l'invio è considerato automatico. */
export const MIN_FILL_MS = 2_000;

export function isLikelySpam(input: { honeypot?: unknown; elapsedMs?: unknown }): boolean {
  if (typeof input.honeypot === "string" && input.honeypot.trim() !== "") return true;
  return typeof input.elapsedMs !== "number" || input.elapsedMs < MIN_FILL_MS;
}

/** Limite di frequenza a finestra fissa (in memoria: indicativo su server serverless). */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; start: number }>();
  return (key: string, now: number): boolean => {
    const entry = hits.get(key);
    if (!entry || now - entry.start >= windowMs) {
      hits.set(key, { count: 1, start: now });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}
