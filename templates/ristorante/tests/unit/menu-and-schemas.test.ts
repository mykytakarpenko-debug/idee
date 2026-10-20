import { describe, expect, it } from "vitest";
import { STATIC_MENU } from "@/lib/demo/seed";
import { activeFilterCount, emptyFilters, matchesFilters } from "@/lib/domain/menu";
import {
  bookingFormSchema,
  checkoutFormSchema,
  deliverySettingsSchema,
} from "@/lib/domain/schemas";

const dishes = STATIC_MENU.dishes;
const filter = (patch: Partial<typeof emptyFilters>) =>
  dishes.filter((d) => matchesFilters(d, { ...emptyFilters, ...patch }));

describe("filtri del menu", () => {
  it("senza filtri mostra tutto", () => {
    expect(filter({})).toHaveLength(dishes.length);
    expect(activeFilterCount(emptyFilters)).toBe(0);
  });

  it("vegetariano include i piatti vegani", () => {
    const vegetarian = filter({ vegetarian: true });
    expect(vegetarian.length).toBeGreaterThan(0);
    expect(vegetarian.every((d) => d.vegetarian || d.vegan)).toBe(true);
    expect(filter({ vegan: true }).every((d) => d.vegan)).toBe(true);
  });

  it("senza glutine ed esclusione allergeni", () => {
    expect(filter({ glutenFree: true }).some((d) => d.allergens.includes("glutine"))).toBe(false);
    const result = filter({ excludeAllergens: ["latte", "uova"] });
    expect(result.some((d) => d.allergens.includes("latte") || d.allergens.includes("uova"))).toBe(
      false,
    );
    expect(
      activeFilterCount({ ...emptyFilters, excludeAllergens: ["latte", "uova"], vegan: true }),
    ).toBe(3);
  });

  it("la ricerca ignora maiuscole e accenti", () => {
    expect(filter({ query: "RAGU" }).map((d) => d.name)).toContain("Tagliatelle al ragù");
  });
});

describe("schemi dei moduli", () => {
  const booking = {
    name: "Anna Bianchi",
    phone: "+39 333 000 0000",
    email: "anna@example.com",
    notes: "",
    privacy: true,
    marketing: false,
  };

  it("la prenotazione richiede il consenso privacy", () => {
    expect(bookingFormSchema.safeParse(booking).success).toBe(true);
    expect(bookingFormSchema.safeParse({ ...booking, privacy: false }).success).toBe(false);
    expect(bookingFormSchema.safeParse({ ...booking, email: "non-valida" }).success).toBe(false);
  });

  const checkout = {
    type: "takeaway" as const,
    when: "asap" as const,
    scheduledTime: "",
    street: "",
    postalCode: "",
    city: "",
    addressNotes: "",
    name: "Anna Bianchi",
    phone: "+39 333 000 0000",
    email: "anna@example.com",
    payment: "cash" as const,
    notes: "",
    privacy: true,
  };

  it("l'indirizzo serve solo per la consegna", () => {
    expect(checkoutFormSchema.safeParse(checkout).success).toBe(true);
    const delivery = checkoutFormSchema.safeParse({ ...checkout, type: "delivery" });
    expect(delivery.success).toBe(false);
    const paths = delivery.error?.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["street", "postalCode", "city"]));
    expect(
      checkoutFormSchema.safeParse({
        ...checkout,
        type: "delivery",
        street: "Via Roma 1",
        postalCode: "40121",
        city: "Bologna",
      }).success,
    ).toBe(true);
  });

  it("un orario programmato deve essere valido", () => {
    expect(
      checkoutFormSchema.safeParse({ ...checkout, when: "scheduled", scheduledTime: "" }).success,
    ).toBe(false);
    expect(
      checkoutFormSchema.safeParse({ ...checkout, when: "scheduled", scheduledTime: "20:15" })
        .success,
    ).toBe(true);
  });

  it("i CAP serviti vengono letti da un elenco libero", () => {
    const base = {
      enabled: true,
      takeawayEnabled: true,
      minOrder: "20",
      fee: "3,50",
      freeAbove: "40",
      prepMinutes: "25",
      deliveryMinutes: "20",
    };
    const parsed = deliverySettingsSchema.parse({
      ...base,
      postalCodes: "40121, 40122;40121 40123",
    });
    expect(parsed.postalCodes).toEqual(["40121", "40122", "40123"]);
    expect(parsed.fee).toBe(350);
    expect(deliverySettingsSchema.safeParse({ ...base, postalCodes: "4012" }).success).toBe(false);
  });
});
