"use client";

import { useId, useState } from "react";
import { copy } from "@/content/it";
import { plans } from "@/content/site";
import { annualSavings, yearlyTotal } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";

const t = copy.pricing;

/** Stima del costo annuo del piano Team per un numero di persone. */
export function PricingCalculator() {
  const id = useId();
  const [people, setPeople] = useState(8);
  const team = plans.find((p) => p.id === "team")!;
  const total = yearlyTotal(team, "annual", people) ?? 0;
  const savings = annualSavings(team, people);
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="rounded-2xl border border-line bg-surface p-6"
    >
      <h2 id={`${id}-title`} className="text-lg font-semibold text-fg">
        {t.calculator}
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        <label htmlFor={id} className="flex justify-between text-sm font-medium text-fg">
          {t.people}
          <output htmlFor={id} className="tabular-nums">
            {people}
          </output>
        </label>
        <input
          id={id}
          type="range"
          min={1}
          max={50}
          value={people}
          onChange={(e) => setPeople(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>
      <p aria-live="polite" className="mt-4 text-sm text-fg">
        {t.estimate(people, formatCurrency(total))}
        <span className="block text-[13px] text-fg-muted">
          {t.savings(formatCurrency(savings))}
        </span>
      </p>
    </section>
  );
}
