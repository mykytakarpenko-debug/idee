import { effectivePrice, includedVat } from "./pricing";
import type {
  Cents,
  Coupon,
  ISODate,
  Product,
  ShippingMethod,
  ShopSettings,
  Variant,
} from "./types";

/** Carrello, codici sconto, spedizione e totali. Funzioni pure, testate. */

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface PricedLine extends CartLine {
  product: Product;
  variant: Variant;
  unitPrice: Cents;
  total: Cents;
}

/** Righe con prodotto, variante e prezzo di oggi; ignora prodotti non più disponibili. */
export function priceCart(
  lines: readonly CartLine[],
  products: readonly Product[],
  today: ISODate,
): PricedLine[] {
  const priced: PricedLine[] = [];
  for (const line of lines) {
    const product = products.find((p) => p.id === line.productId && p.active);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant || line.quantity <= 0) continue;
    const unitPrice = effectivePrice(product, today);
    priced.push({ ...line, product, variant, unitPrice, total: unitPrice * line.quantity });
  }
  return priced;
}

export type CouponCheck =
  | { ok: true; coupon: Coupon }
  | { ok: false; reason: "unknown" | "inactive" | "expired" | "min_subtotal"; minSubtotal?: Cents };

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function checkCoupon(
  code: string,
  coupons: readonly Coupon[],
  subtotal: Cents,
  today: ISODate,
): CouponCheck {
  const coupon = coupons.find((c) => c.code === normalizeCode(code));
  if (!coupon) return { ok: false, reason: "unknown" };
  if (!coupon.active) return { ok: false, reason: "inactive" };
  if (coupon.expiresAt && coupon.expiresAt < today) return { ok: false, reason: "expired" };
  if (subtotal < coupon.minSubtotal)
    return { ok: false, reason: "min_subtotal", minSubtotal: coupon.minSubtotal };
  return { ok: true, coupon };
}

export function couponDiscount(coupon: Coupon | null, subtotal: Cents): Cents {
  if (!coupon) return 0;
  if (coupon.type === "percent") return Math.round((subtotal * coupon.value) / 100);
  if (coupon.type === "fixed") return Math.min(coupon.value, subtotal);
  return 0;
}

/** Costo di spedizione: la soglia gratuita vale sul totale merce già scontato. */
export function shippingCost(
  method: ShippingMethod,
  merchandise: Cents,
  shipping: ShopSettings["shipping"],
  coupon: Coupon | null = null,
): Cents {
  if (merchandise <= 0) return 0;
  if (method === "pickup") return 0;
  if (method === "express") return shipping.express;
  if (coupon?.type === "free_shipping") return 0;
  return merchandise >= shipping.freeThreshold ? 0 : shipping.standard;
}

export interface CartTotals {
  subtotal: Cents;
  discount: Cents;
  shipping: Cents;
  total: Cents;
  /** IVA inclusa nel totale. */
  vat: Cents;
  /** Quanto manca alla spedizione standard gratuita (0 se già raggiunta). */
  freeShippingRemaining: Cents;
}

export function cartTotals(input: {
  subtotal: Cents;
  coupon: Coupon | null;
  method: ShippingMethod;
  settings: Pick<ShopSettings, "shipping" | "vatRate">;
}): CartTotals {
  const { subtotal, coupon, method, settings } = input;
  const discount = couponDiscount(coupon, subtotal);
  const merchandise = subtotal - discount;
  const shipping = shippingCost(method, merchandise, settings.shipping, coupon);
  const total = merchandise + shipping;
  return {
    subtotal,
    discount,
    shipping,
    total,
    vat: includedVat(total, settings.vatRate),
    freeShippingRemaining:
      coupon?.type === "free_shipping"
        ? 0
        : Math.max(0, settings.shipping.freeThreshold - merchandise),
  };
}

/** Aggiunge o somma una riga, senza superare la disponibilità. */
export function addLine(
  lines: readonly CartLine[],
  line: CartLine,
  stock: number,
): { lines: CartLine[]; added: number } {
  const existing = lines.find(
    (l) => l.productId === line.productId && l.variantId === line.variantId,
  );
  const current = existing?.quantity ?? 0;
  const quantity = Math.min(stock, current + line.quantity);
  const added = Math.max(0, quantity - current);
  if (added === 0) return { lines: [...lines], added };
  const next = existing
    ? lines.map((l) => (l === existing ? { ...l, quantity } : l))
    : [...lines, { ...line, quantity }];
  return { lines: next, added };
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((acc, line) => acc + line.quantity, 0);
}
