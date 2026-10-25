/**
 * Consenso ai cookie secondo le Linee guida del Garante (10 giugno 2021):
 * - prima del consenso solo strumenti tecnici;
 * - "Rifiuta" con la stessa evidenza di "Accetta"; chiudere il banner equivale a rifiutare;
 * - scelte per categoria, modificabili in ogni momento;
 * - la richiesta non si ripete prima di 6 mesi, salvo cambiamenti (nuova versione).
 */

export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 180;
export const CONSENT_STORAGE_KEY = "vetrina:consent";

export type ConsentCategory = "statistics" | "marketing";

export interface Consent {
  version: number;
  /** Istante della scelta (ISO), utile anche come prova del consenso. */
  date: string;
  statistics: boolean;
  marketing: boolean;
}

export function makeConsent(choices: Record<ConsentCategory, boolean>, now: Date): Consent {
  return { version: CONSENT_VERSION, date: now.toISOString(), ...choices };
}

export const acceptAll = (now: Date) => makeConsent({ statistics: true, marketing: true }, now);
export const rejectAll = (now: Date) => makeConsent({ statistics: false, marketing: false }, now);

/** Legge il consenso salvato; null se assente, non valido, di una versione precedente o scaduto. */
export function parseConsent(raw: string | null, now: Date): Consent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Consent>;
    if (
      value.version !== CONSENT_VERSION ||
      typeof value.date !== "string" ||
      typeof value.statistics !== "boolean" ||
      typeof value.marketing !== "boolean"
    ) {
      return null;
    }
    const age = now.getTime() - new Date(value.date).getTime();
    if (!Number.isFinite(age) || age > CONSENT_MAX_AGE_DAYS * 86_400_000) return null;
    return value as Consent;
  } catch {
    return null;
  }
}

export function allows(consent: Consent | null, category: ConsentCategory): boolean {
  return consent?.[category] === true;
}
