"use client";

import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useSiteData } from "@/hooks/use-site-data";
import { annualMonthlyEquivalent, annualPrice } from "@/lib/domain/membership";
import type { Plan } from "@/lib/domain/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container, SectionHeading } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

const t = copy.pricing;
type Cycle = "monthly" | "annual";

export function PricingView() {
  const { plans } = useSiteData();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const active = plans.filter((p) => p.active);

  return (
    <div className="animate-page-in">
      <Container className="py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading as="h1" title={t.title} description={t.description} />
          <div className="flex items-center gap-3">
            <SegmentedControl<Cycle>
              ariaLabel={t.billing}
              value={cycle}
              onChange={setCycle}
              options={[
                { value: "monthly", label: t.monthly },
                { value: "annual", label: t.annual },
              ]}
            />
            <Badge tone="success">{t.annualBadge}</Badge>
          </div>
        </div>

        <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {active.map((plan) => (
            <PlanCard key={plan.id} plan={plan} cycle={cycle} />
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-[13px] text-fg-muted">{t.legal}</p>
      </Container>

      <section aria-labelledby="compare" className="border-y border-line bg-surface">
        <Container className="py-12 sm:py-16">
          <SectionHeading id="compare" title={t.compareTitle} />
          <div className="mt-8 rounded-xl border border-line">
            <table className="w-full table-fixed text-[13px] sm:text-sm">
              <thead className="bg-surface-2 text-left">
                <tr>
                  <th scope="col" className="w-[34%] px-2 py-3 font-medium text-fg-muted sm:px-4">
                    {t.compare.feature}
                  </th>
                  {active.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className="px-2 py-3 font-semibold break-words text-fg sm:px-4"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(
                  [
                    [t.compare.gym, (p: Plan) => p.includesGym],
                    [t.compare.classes, (p: Plan) => p.includesClasses],
                    [t.compare.booking, (p: Plan) => p.includesClasses],
                    [t.compare.renewal, (p: Plan) => p.billing === "monthly"],
                  ] as const
                ).map(([label, has]) => (
                  <tr key={label}>
                    <th scope="row" className="px-2 py-3 text-left font-normal text-fg sm:px-4">
                      {label}
                    </th>
                    {active.map((plan) => (
                      <td key={plan.id} className="px-2 py-3 sm:px-4">
                        {has(plan) ? (
                          <span className="inline-flex items-center gap-1.5 text-success">
                            <Check aria-hidden className="size-4" />
                            <span className="sr-only">{copy.common.yes}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-fg-subtle">
                            <Minus aria-hidden className="size-4" />
                            <span className="sr-only">{copy.common.no}</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section aria-labelledby="faq">
        <Container className="max-w-3xl py-12 sm:py-16">
          <SectionHeading id="faq" title={t.faqTitle} />
          <div className="mt-8 divide-y divide-line rounded-xl border border-line bg-surface">
            {t.faq.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-fg">
                  {item.q}
                  <span
                    aria-hidden
                    className="text-xl leading-none text-fg-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-fg-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}

function PlanCard({ plan, cycle }: { plan: Plan; cycle: Cycle }) {
  const annual = cycle === "annual" && plan.billing === "monthly";
  const monthlyEquivalent = annual ? annualMonthlyEquivalent(plan) : null;
  const yearly = annual ? annualPrice(plan) : null;

  return (
    <li
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        plan.featured ? "border-accent bg-surface shadow-md" : "border-line bg-surface",
      )}
    >
      {plan.featured ? (
        <Badge tone="accent" className="absolute -top-3 left-6">
          {t.featured}
        </Badge>
      ) : null}
      <h2 className="font-display text-xl font-bold text-fg">{plan.name}</h2>
      <p className="mt-1 text-sm text-fg-muted">{plan.description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold text-fg tabular-nums">
          {formatCurrency(monthlyEquivalent ?? plan.price, { round: monthlyEquivalent === null })}
        </span>
        {plan.billing === "monthly" ? (
          <span className="text-sm text-fg-muted">{t.perMonth}</span>
        ) : null}
      </p>
      <p className="mt-1 min-h-5 text-[13px] text-fg-muted">
        {yearly !== null
          ? t.perYearNote(formatCurrency(yearly, { round: true }))
          : plan.billing === "pack" && plan.entries && plan.validityDays
            ? t.pack(plan.entries, plan.validityDays)
            : " "}
      </p>
      <ul className="mt-6 flex-1 space-y-2 text-sm text-fg">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex gap-2">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
            {perk}
          </li>
        ))}
      </ul>
      <Link
        href={routes.trial}
        className={buttonClasses({
          variant: plan.featured ? "primary" : "secondary",
          className: "mt-6 w-full",
        })}
      >
        {t.choose}
        <span className="sr-only"> · {plan.name}</span>
      </Link>
    </li>
  );
}
