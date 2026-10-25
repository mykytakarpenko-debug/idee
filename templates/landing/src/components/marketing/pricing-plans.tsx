"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { copy } from "@/content/it";
import { plans, type Plan } from "@/content/site";
import { routes } from "@/config/navigation";
import { pricePerPerson, type Billing } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

const t = copy.pricing;

/** Piani con selettore mensile/annuale. */
export function PricingPlans({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const [billing, setBilling] = useState<Billing>("annual");
  return (
    <div>
      <div className="flex justify-center">
        <SegmentedControl
          ariaLabel={t.billing}
          value={billing}
          onChange={setBilling}
          options={[
            { value: "monthly", label: t.monthly },
            {
              value: "annual",
              label: (
                <>
                  {t.annual}
                  <span className="rounded-full bg-accent-soft px-1.5 text-[11px] font-semibold text-accent-soft-fg">
                    {t.annualBadge}
                  </span>
                </>
              ),
            },
          ]}
        />
      </div>
      <ul className="mt-8 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.id}>
            <PlanCard plan={plan} billing={billing} Heading={headingLevel} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-[13px] text-fg-muted">{t.vatNote}</p>
    </div>
  );
}

function PlanCard({
  plan,
  billing,
  Heading,
}: {
  plan: Plan;
  billing: Billing;
  Heading: "h2" | "h3";
}) {
  const price = pricePerPerson(plan, billing);
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-surface p-6",
        plan.highlighted ? "border-accent shadow-md" : "border-line",
      )}
    >
      {plan.highlighted ? (
        <p className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-semibold text-accent-fg">
          {t.popular}
        </p>
      ) : null}
      <Heading className="text-lg font-semibold text-fg">{plan.name}</Heading>
      <p className="mt-1 text-sm text-fg-muted">{plan.description}</p>
      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight text-fg tabular-nums">
          {price === null ? t.custom : price === 0 ? t.free : formatCurrency(price)}
        </span>
        {price !== null && price > 0 ? (
          <span className="text-sm text-fg-muted">{t.perPerson}</span>
        ) : null}
      </p>
      <p className="mt-1 min-h-5 text-[13px] text-fg-muted">
        {price !== null && price > 0
          ? billing === "annual"
            ? t.billedAnnually(formatCurrency(price * 12))
            : t.billedMonthly
          : ""}
      </p>
      <ul className="mt-6 grid flex-1 content-start gap-2.5 text-sm text-fg">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={`${routes.contact}?piano=${plan.id}`}
        className={buttonClasses({
          variant: plan.highlighted ? "primary" : "secondary",
          size: "lg",
          className: "mt-8 w-full",
        })}
        aria-label={`${plan.cta} – ${plan.name}`}
      >
        {plan.cta}
      </Link>
    </article>
  );
}
