import { describe, expect, it } from "vitest";
import { createDemoData } from "@/lib/demo/seed";
import { revenueByDay, salesKpis, topProducts } from "@/lib/domain/analytics";
import {
  DEFAULT_FILTERS,
  filterProducts,
  filtersToQuery,
  normalize,
  parseFilters,
  ratingSummary,
  relatedProducts,
} from "@/lib/domain/catalog";
import { adjustStock, lowStockVariants, stockIssues, stockLevel } from "@/lib/domain/inventory";
import {
  canCancel,
  nextStatus,
  orderNumber,
  refundAmount,
  returnEligibility,
  sellerBreakdown,
} from "@/lib/domain/orders";
import { priceInfo } from "@/lib/domain/pricing";
import type { Order } from "@/lib/domain/types";

const NOW = new Date(2026, 9, 21, 10, 0);
const TODAY = "2026-10-21";
const data = createDemoData(NOW);
const context = {
  today: TODAY,
  reviews: data.reviews,
  categories: data.categories,
  sellers: data.sellers,
};

function order(patch: Partial<Order> = {}): Order {
  return {
    id: "o1",
    number: "BT-10001",
    customerId: "c1",
    email: "a@example.com",
    phone: "+39 333 000 0000",
    shippingAddress: {
      name: "Anna Bianchi",
      street: "Via dell'Esempio 1",
      postalCode: "40121",
      city: "Bologna",
      province: "BO",
      country: "IT",
      phone: "+39 333 000 0000",
    },
    lines: [
      {
        productId: "a",
        variantId: "a1",
        sellerId: "s1",
        name: "A",
        variantName: "x",
        unitPrice: 2000,
        quantity: 2,
      },
      {
        productId: "b",
        variantId: "b1",
        sellerId: "s2",
        name: "B",
        variantName: "y",
        unitPrice: 1000,
        quantity: 1,
      },
    ],
    subtotal: 5000,
    discount: 500,
    shipping: 590,
    total: 5090,
    coupon: "PROVA10",
    shippingMethod: "standard",
    payment: "card",
    status: "delivered",
    tracking: null,
    createdAt: new Date(2026, 9, 10, 12).toISOString(),
    deliveredAt: new Date(2026, 9, 13, 12).toISOString(),
    history: [],
    returnRequest: null,
    marketingConsent: false,
    ...patch,
  };
}

describe("ordini e resi", () => {
  it("segue il flusso pagato → preparazione → spedito → consegnato", () => {
    expect(nextStatus("awaiting_payment")).toBe("paid");
    expect(nextStatus("paid")).toBe("processing");
    expect(nextStatus("processing")).toBe("shipped");
    expect(nextStatus("shipped")).toBe("delivered");
    expect(nextStatus("delivered")).toBeNull();
    expect(canCancel("processing")).toBe(true);
    expect(canCancel("shipped")).toBe(false);
    expect(orderNumber(7)).toBe("BT-10007");
  });

  it("consente il recesso per 14 giorni dalla consegna", () => {
    const delivered = order();
    expect(returnEligibility(delivered, 14, NOW).eligible).toBe(true);
    const late = returnEligibility(delivered, 14, new Date(2026, 9, 28, 12));
    expect(late).toMatchObject({ eligible: false, reason: "expired" });
    expect(
      returnEligibility(order({ status: "shipped", deliveredAt: null }), 14, NOW),
    ).toMatchObject({
      reason: "not_delivered",
    });
    const requested = order({
      returnRequest: { at: "", lines: [], reason: "", status: "requested", refund: 0 },
    });
    expect(returnEligibility(requested, 14, NOW)).toMatchObject({ reason: "already_requested" });
  });

  it("rimborsa gli articoli al netto della quota di sconto", () => {
    // 2000 su 5000 di merce: quota di sconto 200.
    expect(refundAmount(order(), [{ index: 0, quantity: 1 }], 590)).toBe(1800);
    // Reso totale: merce 5000 − sconto 500 + spedizione standard.
    expect(
      refundAmount(
        order(),
        [
          { index: 0, quantity: 2 },
          { index: 1, quantity: 1 },
        ],
        590,
      ),
    ).toBe(5090);
    // Con la spedizione espressa si rimborsa solo il costo della standard.
    expect(
      refundAmount(
        order({ shipping: 990, total: 5490 }),
        [
          { index: 0, quantity: 2 },
          { index: 1, quantity: 1 },
        ],
        590,
      ),
    ).toBe(5090);
    expect(refundAmount(order(), [{ index: 0, quantity: 9 }], 590)).toBe(3600);
  });

  it("ripartisce il venduto per venditore al netto dei resi rimborsati", () => {
    const sellers = [
      { id: "s1", commissionRate: 0.15 },
      { id: "s2", commissionRate: 0.1 },
    ];
    const refunded = order({
      id: "o2",
      returnRequest: {
        at: "",
        lines: [{ index: 0, quantity: 1 }],
        reason: "",
        status: "refunded",
        refund: 1800,
      },
    });
    const rows = sellerBreakdown(
      [order(), refunded, order({ id: "o3", status: "cancelled" })],
      sellers,
      new Date(2026, 9, 1),
      new Date(2026, 9, 22),
    );
    expect(rows[0]).toEqual({
      sellerId: "s1",
      orders: 2,
      units: 3,
      gross: 6000,
      commission: 900,
      net: 5100,
    });
    expect(rows[1]).toMatchObject({ orders: 2, units: 2, gross: 2000, commission: 200 });
  });
});

describe("scorte", () => {
  it("classifica la disponibilità e trova i problemi", () => {
    expect(stockLevel(0, 3)).toBe("out");
    expect(stockLevel(3, 3)).toBe("low");
    expect(stockLevel(4, 3)).toBe("in_stock");
    const product = data.products.find((p) => p.id === "ciotola-onda")!;
    const out = product.variants.find((v) => v.stock === 0)!;
    const issues = stockIssues(
      [{ productId: product.id, variantId: out.id, quantity: 1 }],
      data.products,
    );
    expect(issues).toEqual([
      { productId: product.id, variantId: out.id, quantity: 1, requested: 1, available: 0 },
    ]);
  });

  it("scala e ripristina le scorte senza modificare l'originale", () => {
    const product = data.products[0]!;
    const variant = product.variants[0]!;
    const line = { productId: product.id, variantId: variant.id, quantity: 2 };
    const after = adjustStock(data.products, [line]);
    expect(after[0]!.variants[0]!.stock).toBe(variant.stock - 2);
    expect(adjustStock(after, [line], 1)[0]!.variants[0]!.stock).toBe(variant.stock);
    expect(data.products[0]!.variants[0]!.stock).toBe(variant.stock);
    expect(lowStockVariants(data.products, 3).every((v) => v.variant.stock <= 3)).toBe(true);
  });
});

describe("catalogo", () => {
  it("cerca senza accenti e su più parole", () => {
    expect(normalize("Città Lìno")).toBe("citta lino");
    const found = filterProducts(data.products, { ...DEFAULT_FILTERS, q: "lino righe" }, context);
    expect(found.map((p) => p.id)).toEqual(["canovaccio-righe"]);
    const bySeller = filterProducts(data.products, { ...DEFAULT_FILTERS, q: "argilla" }, context);
    expect(bySeller.every((p) => p.sellerId === "s_argilla")).toBe(true);
  });

  it("filtra per categoria, prezzo, disponibilità e offerte", () => {
    const ceramics = filterProducts(
      data.products,
      { ...DEFAULT_FILTERS, category: "ceramiche" },
      context,
    );
    expect(ceramics.length).toBe(6);
    const cheap = filterProducts(data.products, { ...DEFAULT_FILTERS, maxPrice: 1500 }, context);
    expect(cheap.map((p) => p.id).sort()).toEqual([
      "biglietti-buste",
      "candele-affusolate",
      "canovaccio-righe",
      "quaderno-puntinato",
    ]);
    const offers = filterProducts(data.products, { ...DEFAULT_FILTERS, onSale: true }, context);
    // La promozione delle tazzine non è uno sconto annunciabile (Omnibus).
    expect(offers.map((p) => p.id).sort()).toEqual([
      "candela-fico",
      "canovaccio-righe",
      "ciotola-onda",
    ]);
  });

  it("ordina per prezzo e mette in evidenza i disponibili", () => {
    const asc = filterProducts(data.products, { ...DEFAULT_FILTERS, sort: "price_asc" }, context);
    const prices = asc.map((p) => priceInfo(p, TODAY).price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices[0]).toBe(1200);
    const featured = filterProducts(data.products, DEFAULT_FILTERS, context);
    expect(featured[0]!.featured).toBe(true);
  });

  it("converte i filtri da e verso l'URL", () => {
    const filters = {
      ...DEFAULT_FILTERS,
      q: "tazza",
      category: "ceramiche",
      maxPrice: 3000,
      onSale: true,
      sort: "price_desc" as const,
    };
    const query = filtersToQuery(filters);
    expect(query).toBe("?q=tazza&categoria=ceramiche&max=30&offerte=1&ordina=price_desc");
    expect(parseFilters(new URLSearchParams(query.slice(1)))).toEqual(filters);
    expect(parseFilters(new URLSearchParams("ordina=boh&max=-3"))).toEqual(DEFAULT_FILTERS);
  });

  it("riassume le recensioni e propone prodotti correlati", () => {
    const summary = ratingSummary(data.reviews, "tazza-alba");
    expect(summary.count).toBe(summary.distribution.reduce((a, b) => a + b, 0));
    const tazza = data.products.find((p) => p.id === "tazza-alba")!;
    const related = relatedProducts(tazza, data.products);
    expect(related).toHaveLength(4);
    expect(related.every((p) => p.id !== tazza.id)).toBe(true);
    expect(related[0]!.categoryId).toBe("ceramiche");
  });
});

describe("indicatori", () => {
  it("calcola incassi, ordini e serie giornaliera", () => {
    const kpis = salesKpis(data.orders, NOW, 30);
    expect(kpis.orders).toBeGreaterThan(40);
    expect(kpis.averageOrder).toBe(Math.round(kpis.revenue / kpis.orders));
    const days = revenueByDay(data.orders, new Date(2026, 8, 22), 30);
    expect(days).toHaveLength(30);
    expect(days.reduce((acc, d) => acc + d.revenue, 0)).toBe(kpis.revenue);
    const top = topProducts(data.orders, new Date(2026, 8, 22), 3);
    expect(top).toHaveLength(3);
    expect(top[0]!.revenue).toBeGreaterThanOrEqual(top[1]!.revenue);
  });
});
