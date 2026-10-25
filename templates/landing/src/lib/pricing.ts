import { ANNUAL_DISCOUNT, type Plan } from "@/content/site";

/** Prezzi dei piani. Funzioni pure, testate. Importi in centesimi, IVA esclusa. */

export type Billing = "monthly" | "annual";

/** Prezzo mensile per persona con la fatturazione scelta (arrotondato al centesimo). */
export function pricePerPerson(plan: Pick<Plan, "monthly">, billing: Billing): number | null {
  if (plan.monthly === null) return null;
  if (billing === "monthly") return plan.monthly;
  return Math.round(plan.monthly * (1 - ANNUAL_DISCOUNT));
}

/** Totale annuo per un team: con fatturazione annuale si paga 12 × prezzo scontato. */
export function yearlyTotal(
  plan: Pick<Plan, "monthly" | "maxPeople">,
  billing: Billing,
  people: number,
): number | null {
  const price = pricePerPerson(plan, billing);
  if (price === null) return null;
  if (plan.maxPeople !== null && people > plan.maxPeople) return null;
  return price * people * 12;
}

/** Risparmio annuo passando alla fatturazione annuale. */
export function annualSavings(plan: Pick<Plan, "monthly" | "maxPeople">, people: number): number {
  const monthly = yearlyTotal(plan, "monthly", people);
  const annual = yearlyTotal(plan, "annual", people);
  return monthly === null || annual === null ? 0 : monthly - annual;
}

export const VAT_RATE = 0.22;

/** Prezzo IVA inclusa (per chi acquista come privato). */
export function withVat(cents: number): number {
  return Math.round(cents * (1 + VAT_RATE));
}
