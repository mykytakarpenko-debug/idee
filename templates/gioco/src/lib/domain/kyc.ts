import type { ISODate } from "./types";

/**
 * Verifiche di identità in fase di registrazione (solo formato e coerenza).
 * In produzione il codice fiscale si verifica con l'Anagrafe tributaria tramite
 * i servizi previsti da ADM e il documento con un fornitore di verifica dell'identità.
 */

export const MIN_AGE = 18;

/** Età compiuta in anni alla data indicata. */
export function ageOn(birthDate: ISODate, today: ISODate): number {
  const [by, bm, bd] = birthDate.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = today.split("-").map(Number) as [number, number, number];
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

export function isAdult(birthDate: ISODate, today: ISODate): boolean {
  return ageOn(birthDate, today) >= MIN_AGE;
}

const ODD: Record<string, number> = {
  "0": 1,
  "1": 0,
  "2": 5,
  "3": 7,
  "4": 9,
  "5": 13,
  "6": 15,
  "7": 17,
  "8": 19,
  "9": 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23,
};

function evenValue(char: string): number {
  return /\d/.test(char) ? Number(char) : char.charCodeAt(0) - 65;
}

/** Carattere di controllo (16°) per i primi 15 caratteri del codice fiscale. */
export function fiscalCodeCheckChar(first15: string): string {
  let sum = 0;
  for (let i = 0; i < 15; i += 1) {
    const char = first15[i]!;
    // Posizioni dispari (1ª, 3ª…) hanno indice pari.
    sum += i % 2 === 0 ? ODD[char]! : evenValue(char);
  }
  return String.fromCharCode(65 + (sum % 26));
}

/** Cifre sostituite da lettere in caso di omocodia. */
const OMOCODE = "LMNPQRSTUV";
const FORMAT =
  /^[A-Z]{6}[\dLMNPQRSTUV]{2}[ABCDEHLMPRST][\dLMNPQRSTUV]{2}[A-Z][\dLMNPQRSTUV]{3}[A-Z]$/;

export function normalizeFiscalCode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidFiscalCode(value: string): boolean {
  const cf = normalizeFiscalCode(value);
  return FORMAT.test(cf) && fiscalCodeCheckChar(cf.slice(0, 15)) === cf[15];
}

const decodeDigits = (chars: string) =>
  Number([...chars].map((c) => (OMOCODE.includes(c) ? String(OMOCODE.indexOf(c)) : c)).join(""));

const MONTHS = "ABCDEHLMPRST";

/** Il codice fiscale contiene la data di nascita indicata (giorno +40 per le donne). */
export function fiscalCodeMatchesBirthDate(value: string, birthDate: ISODate): boolean {
  const cf = normalizeFiscalCode(value);
  if (!FORMAT.test(cf)) return false;
  const [y, m, d] = birthDate.split("-").map(Number) as [number, number, number];
  const year = decodeDigits(cf.slice(6, 8));
  const month = MONTHS.indexOf(cf[8]!) + 1;
  let day = decodeDigits(cf.slice(9, 11));
  if (day > 40) day -= 40;
  return year === y % 100 && month === m && day === d;
}
