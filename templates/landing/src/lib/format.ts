import { format as formatFns } from "date-fns";
import { it } from "date-fns/locale";
/** Importo in centesimi di euro. */
type Cents = number;

/**
 * Formattazione centralizzata (lingua, valuta, date).
 * Per localizzare il template in un'altra lingua o valuta modifica solo questo file.
 */
export const LOCALE = "it-IT";
export const CURRENCY = "EUR";
const dateLocale = it;

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });
const currencyRoundFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat(LOCALE);
const decimalFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const relativeFormatter = new Intl.RelativeTimeFormat("it", { numeric: "auto" });

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

/** 3850 → "38,50 €". Con `round` omette i decimali: "39 €". */
export function formatCurrency(cents: Cents, options: { round?: boolean } = {}): string {
  const value = cents / 100;
  return options.round ? currencyRoundFormatter.format(value) : currencyFormatter.format(value);
}

/** Forma compatta per assi e spazi stretti: 1250000 → "12,5k €". */
export function formatCurrencyCompact(cents: Cents): string {
  const euros = cents / 100;
  if (Math.abs(euros) >= 1000) return `${decimalFormatter.format(euros / 1000)}k €`;
  return currencyRoundFormatter.format(euros);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 0.1234 → "12,3%". */
export function formatPercent(ratio: number, fractionDigits = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}

/** Variazione con segno esplicito: 0.082 → "+8,2%". */
export function formatDelta(ratio: number): string {
  const formatted = formatPercent(Math.abs(ratio));
  if (ratio > 0) return `+${formatted}`;
  if (ratio < 0) return `−${formatted}`;
  return formatted;
}

const datePatterns = {
  /** 20 ott 2026 */
  short: "d MMM yyyy",
  /** martedì 20 ottobre 2026 */
  long: "EEEE d MMMM yyyy",
  /** martedì 20 ottobre */
  weekdayLong: "EEEE d MMMM",
  /** mar 20 ott */
  weekdayShort: "EEE d MMM",
  /** 20 ott */
  dayMonth: "d MMM",
  /** 20 ottobre */
  dayMonthLong: "d MMMM",
  /** ottobre 2026 */
  monthYear: "MMMM yyyy",
  /** ott */
  monthShort: "MMM",
  /** mar */
  weekdayNarrow: "EEE",
  /** 09:30 */
  time: "HH:mm",
  /** 20/10/2026 */
  numeric: "dd/MM/yyyy",
  /** 20 ott 2026, 09:30 */
  dateTime: "d MMM yyyy, HH:mm",
  /** 2026-10-20 (valore per <input type="date">) */
  inputDate: "yyyy-MM-dd",
} as const;

export type DatePattern = keyof typeof datePatterns;

export function formatDate(value: DateInput, pattern: DatePattern = "short"): string {
  return formatFns(toDate(value), datePatterns[pattern], { locale: dateLocale });
}

/** "09:30–10:15" */
export function formatTimeRange(start: DateInput, end: DateInput): string {
  return `${formatDate(start, "time")}–${formatDate(end, "time")}`;
}

/** 90 → "1 h 30 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Tempo relativo rispetto a `now`: "5 minuti fa", "ieri", "tra 2 giorni". */
export function formatRelative(value: DateInput, now: Date): string {
  const diffMs = toDate(value).getTime() - now.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 1) return "adesso";
  if (Math.abs(minutes) < 60) return relativeFormatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return relativeFormatter.format(days, "day");
  return formatDate(value, "short");
}

/** Prima lettera maiuscola (date-fns restituisce i giorni in minuscolo, come da norma italiana). */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Converte un importo digitato in centesimi: "38,50", "38.50", "1.234,5", "1234".
 * Restituisce NaN se il formato non è valido.
 */
export function parseEurosToCents(value: string): number {
  let normalized = value.replace(/[\s €]/g, "");
  if (normalized.includes(",")) {
    // Formato italiano: il punto separa le migliaia, la virgola i decimali.
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    // "1.234" senza virgola: punto come separatore delle migliaia.
    normalized = normalized.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Math.round(Number.parseFloat(normalized) * 100);
}

/** Centesimi → valore modificabile in un campo: 3850 → "38,50". */
export function centsToInput(cents: Cents): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
