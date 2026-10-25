import { describe, expect, it } from "vitest";
import { catalogAt, createDemoData, DEMO_CUSTOMER_ID, DEMO_SETTINGS } from "@/lib/demo/seed";
import { cartTotals } from "@/lib/domain/cart";
import { itemsCount, returnEligibility } from "@/lib/domain/orders";
import { priceInfo } from "@/lib/domain/pricing";
import {
  checkoutSchema,
  couponFormSchema,
  productFormSchema,
  shippingSchema,
  shopInfoSchema,
} from "@/lib/domain/schemas";
import { productJsonLd, serializeJsonLd, storeJsonLd } from "@/lib/seo";

const NOW = new Date(2026, 9, 21, 10, 0);
const TODAY = "2026-10-21";
const data = createDemoData(NOW);

describe("dati demo", () => {
  it("sono deterministici", () => {
    expect(createDemoData(NOW)).toEqual(data);
  });

  it("hanno un catalogo coerente", () => {
    const ids = new Set(data.products.map((p) => p.id));
    expect(ids.size).toBe(21);
    for (const product of data.products) {
      expect(
        data.sellers.some((s) => s.id === product.sellerId),
        product.id,
      ).toBe(true);
      expect(
        data.categories.some((c) => c.id === product.categoryId),
        product.id,
      ).toBe(true);
      expect(product.variants.length).toBeGreaterThan(0);
      expect(product.priceHistory.map((p) => p.from)).toEqual(
        [...product.priceHistory.map((p) => p.from)].sort(),
      );
    }
    const skus = data.products.flatMap((p) => p.variants.map((v) => v.id));
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("mostrano le promozioni secondo la regola Omnibus", () => {
    const info = (id: string) =>
      priceInfo(
        data.products.find((p) => p.id === id)!,
        TODAY,
      );
    expect(info("ciotola-onda")).toMatchObject({ price: 1760, reference: 2200, percent: 20 });
    expect(info("canovaccio-righe")).toMatchObject({ price: 1200, reference: 1300, percent: 8 });
    expect(info("candela-fico")).toMatchObject({ price: 2200, reference: 2600, percent: 15 });
    expect(info("tazzine-sorso")).toMatchObject({ price: 2800, onSale: false });
  });

  it("hanno ordini con totali e cronologia coerenti", () => {
    expect(data.orders.length).toBeGreaterThan(150);
    const numbers = data.orders.map((o) => o.number);
    expect(new Set(numbers).size).toBe(numbers.length);
    for (const order of data.orders) {
      const subtotal = order.lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
      expect(order.subtotal, order.number).toBe(subtotal);
      expect(order.total).toBe(order.subtotal - order.discount + order.shipping);
      const expected = cartTotals({
        subtotal,
        coupon: order.coupon ? data.settings.coupons.find((c) => c.code === order.coupon)! : null,
        method: order.shippingMethod,
        settings: data.settings,
      });
      expect(order.total, order.number).toBe(expected.total);
      expect(new Date(order.createdAt).getTime()).toBeLessThanOrEqual(NOW.getTime());
      expect(order.history.at(-1)?.status === order.status || order.returnRequest !== null).toBe(
        true,
      );
      if (order.status === "delivered") expect(order.deliveredAt).not.toBeNull();
      expect(itemsCount(order)).toBeGreaterThan(0);
    }
  });

  it("preparano la cliente demo con un reso possibile e uno scaduto", () => {
    const own = data.orders.filter((o) => o.customerId === DEMO_CUSTOMER_ID);
    expect(own).toHaveLength(3);
    const eligibility = own.map((o) => returnEligibility(o, 14, NOW));
    expect(eligibility.filter((e) => e.eligible)).toHaveLength(1);
    expect(eligibility.some((e) => !e.eligible && e.reason === "expired")).toBe(true);
    expect(own.some((o) => o.status === "shipped" && o.tracking)).toBe(true);
  });

  it("includono ordini da spedire e resi da gestire", () => {
    expect(data.orders.some((o) => o.status === "paid" || o.status === "processing")).toBe(true);
    expect(data.orders.some((o) => o.returnRequest?.status === "requested")).toBe(true);
  });
});

describe("schemi", () => {
  const checkout = {
    email: "marta@example.com",
    name: "Marta Bianchi",
    street: "Via dell'Esempio 3",
    postalCode: "40121",
    city: "Bologna",
    province: "bo",
    phone: "+39 333 000 1111",
    notes: "",
    shippingMethod: "standard",
    payment: "card",
    terms: true,
    marketing: false,
  } as const;

  it("valida il checkout e richiede le condizioni di vendita", () => {
    expect(checkoutSchema.parse(checkout).province).toBe("BO");
    expect(checkoutSchema.safeParse({ ...checkout, terms: false }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...checkout, postalCode: "4012" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...checkout, province: "Bologna" }).success).toBe(false);
  });

  it("valida prodotto e promozione", () => {
    const base = {
      name: "Vaso",
      shortDescription: "Vaso piccolo",
      description: "Un vaso.",
      categoryId: "ceramiche",
      sellerId: "s_argilla",
      price: "40",
      salePrice: "",
      saleFrom: "",
      saleTo: "",
      featured: false,
      active: true,
    };
    expect(productFormSchema.parse(base)).toMatchObject({ price: 4000, sale: null });
    expect(
      productFormSchema.parse({ ...base, salePrice: "32", saleFrom: TODAY, saleTo: "2026-11-01" })
        .sale,
    ).toEqual({ price: 3200, from: TODAY, to: "2026-11-01" });
    expect(
      productFormSchema.safeParse({ ...base, salePrice: "45", saleFrom: TODAY, saleTo: TODAY })
        .success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({
        ...base,
        salePrice: "30",
        saleFrom: TODAY,
        saleTo: "2026-10-01",
      }).success,
    ).toBe(false);
  });

  it("valida codici sconto, spedizioni e dati del negozio", () => {
    expect(
      couponFormSchema.parse({
        code: "natale20",
        type: "percent",
        value: "20",
        minSubtotal: "30",
        expiresAt: "",
      }),
    ).toEqual({
      code: "NATALE20",
      type: "percent",
      value: 20,
      minSubtotal: 3000,
      expiresAt: null,
      active: true,
    });
    expect(
      couponFormSchema.safeParse({
        code: "NO",
        type: "percent",
        value: "20",
        minSubtotal: "0",
        expiresAt: "",
      }).success,
    ).toBe(false);
    expect(
      couponFormSchema.safeParse({
        code: "TROPPO",
        type: "percent",
        value: "95",
        minSubtotal: "0",
        expiresAt: "",
      }).success,
    ).toBe(false);
    expect(
      shippingSchema.safeParse({
        standard: "5,90",
        express: "9,90",
        freeThreshold: "69",
        pickupEnabled: true,
        pickupAddress: "",
        returnDays: "10",
      }).success,
    ).toBe(false);
    const info = {
      name: DEMO_SETTINGS.name,
      tagline: DEMO_SETTINGS.tagline,
      ...DEMO_SETTINGS.legal,
    };
    expect(shopInfoSchema.safeParse(info).success).toBe(true);
    expect(shopInfoSchema.safeParse({ ...info, vatNumber: "12345" }).success).toBe(false);
  });
});

describe("SEO", () => {
  it("genera i dati strutturati di negozio e prodotto", () => {
    const catalog = catalogAt(TODAY);
    const store = storeJsonLd(catalog.settings, "https://materia.example");
    expect(store["@graph"][0]["@type"]).toBe("OnlineStore");
    const product = catalog.products.find((p) => p.id === "ciotola-onda")!;
    const json = productJsonLd({
      product,
      seller: catalog.sellers.find((s) => s.id === product.sellerId),
      reviews: catalog.reviews,
      settings: catalog.settings,
      siteUrl: "https://materia.example",
      today: TODAY,
    });
    expect(json.offers.price).toBe("17.60");
    expect(json.offers.availability).toBe("https://schema.org/InStock");
    expect(json.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(14);
    expect(serializeJsonLd({ a: "</script>" })).not.toContain("</script>");
  });
});
