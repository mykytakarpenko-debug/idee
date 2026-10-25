import { describe, expect, it } from "vitest";
import { DEMO_SETTINGS } from "@/lib/demo/seed";
import {
  addLine,
  cartTotals,
  checkCoupon,
  couponDiscount,
  priceCart,
  shippingCost,
} from "@/lib/domain/cart";
import {
  discountPercent,
  effectivePrice,
  includedVat,
  lowestPriceBefore,
  omnibusReference,
  priceInfo,
  priceOn,
} from "@/lib/domain/pricing";
import type { Coupon, Product } from "@/lib/domain/types";

const TODAY = "2026-10-21";

function product(patch: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "p1",
    name: "Tazza",
    sellerId: "s1",
    categoryId: "c1",
    art: "mug",
    shortDescription: "",
    description: "",
    details: [],
    price: 2000,
    sale: null,
    priceHistory: [{ from: "2026-01-01", price: 2000 }],
    variants: [{ id: "v1", name: "Salvia", color: "#8fa58a", sku: "T-1", stock: 5 }],
    weight: 400,
    featured: false,
    active: true,
    createdAt: "2026-01-01",
    ...patch,
  };
}

const coupon = (patch: Partial<Coupon>): Coupon => ({
  code: "PROVA10",
  type: "percent",
  value: 10,
  minSubtotal: 0,
  expiresAt: null,
  active: true,
  ...patch,
});

describe("prezzi e regola Omnibus", () => {
  const history = [
    { from: "2026-01-01", price: 2000 },
    { from: "2026-09-26", price: 1700 },
    { from: "2026-10-03", price: 2000 },
    { from: "2026-10-17", price: 1500 },
  ];

  it("legge il prezzo in vigore in una data", () => {
    expect(priceOn(history, "2025-12-31")).toBeNull();
    expect(priceOn(history, "2026-09-30")).toBe(1700);
    expect(priceOn(history, "2026-10-20")).toBe(1500);
  });

  it("trova il prezzo più basso dei 30 giorni precedenti l'inizio", () => {
    // Finestra 17/09 – 16/10: 2000, poi 1700 (dal 26/09), poi 2000.
    expect(lowestPriceBefore(history, "2026-10-17")).toBe(1700);
    // Il prezzo di lancio vale se il prodotto è più recente della finestra.
    expect(lowestPriceBefore([{ from: "2026-10-10", price: 900 }], "2026-10-17")).toBe(900);
    expect(lowestPriceBefore([], "2026-10-17")).toBeNull();
  });

  it("applica la promozione solo nel periodo", () => {
    const p = product({
      sale: { price: 1500, from: "2026-10-17", to: "2026-10-31" },
      priceHistory: history,
    });
    expect(effectivePrice(p, "2026-10-16")).toBe(2000);
    expect(effectivePrice(p, TODAY)).toBe(1500);
    expect(effectivePrice(p, "2026-11-01")).toBe(2000);
    expect(omnibusReference(p, TODAY)).toBe(1700);
    expect(priceInfo(p, TODAY)).toEqual({
      price: 1500,
      onSale: true,
      reference: 1700,
      percent: 12,
    });
  });

  it("non annuncia uno sconto se il prezzo era già stato applicato", () => {
    const p = product({
      sale: { price: 1700, from: "2026-10-17", to: "2026-10-31" },
      priceHistory: history,
    });
    expect(priceInfo(p, TODAY)).toEqual({
      price: 1700,
      onSale: false,
      reference: null,
      percent: 0,
    });
  });

  it("calcola percentuali e IVA inclusa", () => {
    expect(discountPercent(2000, 1500)).toBe(25);
    expect(discountPercent(2000, 2100)).toBe(0);
    expect(includedVat(12200, 0.22)).toBe(2200);
  });
});

describe("carrello", () => {
  const shipping = DEMO_SETTINGS.shipping;

  it("somma le righe senza superare la disponibilità", () => {
    const first = addLine([], { productId: "p1", variantId: "v1", quantity: 2 }, 3);
    expect(first.added).toBe(2);
    const second = addLine(first.lines, { productId: "p1", variantId: "v1", quantity: 5 }, 3);
    expect(second).toEqual({
      lines: [{ productId: "p1", variantId: "v1", quantity: 3 }],
      added: 1,
    });
    expect(addLine(second.lines, { productId: "p1", variantId: "v1", quantity: 1 }, 3).added).toBe(
      0,
    );
  });

  it("usa il prezzo di oggi e ignora prodotti non più in vendita", () => {
    const products = [
      product({ sale: { price: 1500, from: "2026-10-01", to: "2026-10-31" } }),
      product({ id: "p2", active: false }),
    ];
    const lines = priceCart(
      [
        { productId: "p1", variantId: "v1", quantity: 2 },
        { productId: "p2", variantId: "v1", quantity: 1 },
        { productId: "p1", variantId: "nope", quantity: 1 },
      ],
      products,
      TODAY,
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ unitPrice: 1500, total: 3000 });
  });

  it.each([
    ["sconosciuto", "XYZ", [], 5000, "unknown"],
    ["non attivo", "PROVA10", [coupon({ active: false })], 5000, "inactive"],
    ["scaduto", "PROVA10", [coupon({ expiresAt: "2026-10-20" })], 5000, "expired"],
    ["sotto il minimo", "PROVA10", [coupon({ minSubtotal: 6000 })], 5000, "min_subtotal"],
  ] as const)("rifiuta un codice %s", (_label, code, coupons, subtotal, reason) => {
    const result = checkCoupon(code, coupons, subtotal, TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe(reason);
  });

  it("accetta codici scritti in minuscolo e con spazi", () => {
    expect(checkCoupon(" prova 10 ", [coupon({})], 5000, TODAY).ok).toBe(true);
  });

  it("calcola gli sconti", () => {
    expect(couponDiscount(coupon({ value: 10 }), 4550)).toBe(455);
    expect(couponDiscount(coupon({ type: "fixed", value: 500 }), 300)).toBe(300);
    expect(couponDiscount(coupon({ type: "free_shipping", value: 0 }), 5000)).toBe(0);
    expect(couponDiscount(null, 5000)).toBe(0);
  });

  it("calcola la spedizione con soglia, ritiro, espressa e codice", () => {
    expect(shippingCost("standard", 5000, shipping)).toBe(590);
    expect(shippingCost("standard", 6900, shipping)).toBe(0);
    expect(shippingCost("express", 9000, shipping)).toBe(990);
    expect(shippingCost("pickup", 1000, shipping)).toBe(0);
    expect(shippingCost("standard", 1000, shipping, coupon({ type: "free_shipping" }))).toBe(0);
    expect(shippingCost("standard", 0, shipping)).toBe(0);
  });

  it("applica la soglia gratuita al totale già scontato", () => {
    const totals = cartTotals({
      subtotal: 7000,
      coupon: coupon({ value: 10 }),
      method: "standard",
      settings: DEMO_SETTINGS,
    });
    expect(totals).toMatchObject({
      subtotal: 7000,
      discount: 700,
      shipping: 590,
      total: 6890,
      freeShippingRemaining: 600,
    });
    expect(totals.vat).toBe(6890 - Math.round(6890 / 1.22));
  });
});
