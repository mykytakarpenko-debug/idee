import { isWithin, shiftISODate } from "./dates";
import type { Cents, ISODate, PricePoint, Product } from "./types";

/**
 * Prezzi e promozioni. Regola Omnibus (D.Lgs. 26/2023, art. 17-bis Codice del
 * Consumo): ogni annuncio di riduzione di prezzo indica il prezzo più basso
 * applicato nei 30 giorni precedenti l'inizio della promozione, e lo sconto
 * si calcola su quel prezzo.
 */

export const OMNIBUS_DAYS = 30;

export function isSaleActive(product: Pick<Product, "sale">, today: ISODate): boolean {
  const { sale } = product;
  return sale !== null && isWithin(today, sale.from, sale.to);
}

/** Prezzo da pagare oggi. */
export function effectivePrice(product: Pick<Product, "price" | "sale">, today: ISODate): Cents {
  return isSaleActive(product, today) && product.sale ? product.sale.price : product.price;
}

/** Prezzo in vigore in una data secondo lo storico (null se il prodotto non esisteva). */
export function priceOn(history: readonly PricePoint[], date: ISODate): Cents | null {
  let price: Cents | null = null;
  for (const point of history) {
    if (point.from <= date) price = point.price;
    else break;
  }
  return price;
}

/**
 * Prezzo più basso applicato nei `days` giorni precedenti `until` (escluso).
 * Se il prodotto è in vendita da meno tempo, considera il periodo disponibile.
 */
export function lowestPriceBefore(
  history: readonly PricePoint[],
  until: ISODate,
  days = OMNIBUS_DAYS,
): Cents | null {
  const windowStart = shiftISODate(until, -days);
  const prices: Cents[] = [];
  const atStart = priceOn(history, windowStart);
  if (atStart !== null) prices.push(atStart);
  for (const point of history) {
    if (point.from > windowStart && point.from < until) prices.push(point.price);
  }
  return prices.length > 0 ? Math.min(...prices) : null;
}

/** Prezzo di riferimento da mostrare accanto a una promozione attiva. */
export function omnibusReference(
  product: Pick<Product, "price" | "sale" | "priceHistory">,
  today: ISODate,
): Cents | null {
  if (!isSaleActive(product, today) || !product.sale) return null;
  return lowestPriceBefore(product.priceHistory, product.sale.from) ?? product.price;
}

/** Sconto percentuale intero rispetto al riferimento (0 se non è una riduzione). */
export function discountPercent(reference: Cents, price: Cents): number {
  if (reference <= 0 || price >= reference) return 0;
  return Math.round(((reference - price) / reference) * 100);
}

export interface PriceInfo {
  price: Cents;
  onSale: boolean;
  /** Prezzo più basso dei 30 giorni precedenti la promozione. */
  reference: Cents | null;
  percent: number;
}

export function priceInfo(
  product: Pick<Product, "price" | "sale" | "priceHistory">,
  today: ISODate,
): PriceInfo {
  const price = effectivePrice(product, today);
  const reference = omnibusReference(product, today);
  const percent = reference === null ? 0 : discountPercent(reference, price);
  // Se nei 30 giorni c'era già un prezzo pari o inferiore, non è una riduzione da annunciare.
  return { price, onSale: percent > 0, reference: percent > 0 ? reference : null, percent };
}

/** IVA compresa in un importo lordo: 12200 al 22% → 2200. */
export function includedVat(gross: Cents, rate: number): Cents {
  return gross - Math.round(gross / (1 + rate));
}
