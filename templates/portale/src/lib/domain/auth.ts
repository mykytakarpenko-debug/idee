/**
 * Regole dell'accesso (solo logica, testata). In demo il secondo fattore è un
 * codice mostrato a schermo; in produzione usa TOTP (RFC 6238) o passkey con
 * un provider di autenticazione: vedi docs/sicurezza-privacy.md.
 */

export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export interface AttemptState {
  failures: number;
  /** Istante dell'ultimo errore (ms). */
  lastFailureAt: number | null;
}

export const NO_ATTEMPTS: AttemptState = { failures: 0, lastFailureAt: null };

/** Minuti residui di blocco dopo troppi tentativi falliti (0 = non bloccato). */
export function lockRemaining(state: AttemptState, now: number): number {
  if (state.failures < MAX_ATTEMPTS || state.lastFailureAt === null) return 0;
  const until = state.lastFailureAt + LOCK_MINUTES * 60_000;
  return until > now ? Math.ceil((until - now) / 60_000) : 0;
}

export function registerFailure(state: AttemptState, now: number): AttemptState {
  // Dopo la scadenza del blocco si riparte da zero.
  const base =
    lockRemaining(state, now) === 0 && state.failures >= MAX_ATTEMPTS ? NO_ATTEMPTS : state;
  return { failures: base.failures + 1, lastFailureAt: now };
}

/** Codice a 6 cifre (spazi ammessi). */
export function normalizeOtp(code: string): string | null {
  const digits = code.replace(/\s+/g, "");
  return /^\d{6}$/.test(digits) ? digits : null;
}

/** Confronto a tempo costante (in produzione avviene sul server). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Anonimizza un IPv4 togliendo l'ultimo ottetto (minimizzazione nei registri). */
export function maskIp(ip: string): string {
  const parts = ip.split(".");
  return parts.length === 4 ? `${parts.slice(0, 3).join(".")}.x` : "—";
}
