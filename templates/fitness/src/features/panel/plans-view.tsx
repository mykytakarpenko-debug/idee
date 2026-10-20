"use client";

import { Check, Pencil, Plus } from "lucide-react";
import { copy } from "@/content/it";
import { useData, useDataReady } from "@/hooks/use-data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { openDialog } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Page, PageHeader } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.plans;

export function PlansView() {
  const ready = useDataReady();
  const { plans, members } = useData((state) => ({ plans: state.plans, members: state.members }));
  const updatePlan = useDataStore((state) => state.updatePlan);

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button onClick={() => openDialog({ type: "plan" })}>
            <Plus aria-hidden />
            {t.newPlan}
          </Button>
        }
      />
      {!ready ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const count = members.filter((m) => m.planId === plan.id).length;
            return (
              <li key={plan.id}>
                <Card className={cn("flex h-full flex-col p-6", !plan.active && "border-dashed")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-fg">
                        {plan.name}
                        <Badge>{plan.billing === "pack" ? t.pack : t.monthly}</Badge>
                        {plan.featured ? (
                          <Badge tone="accent">{copy.pricing.featured}</Badge>
                        ) : null}
                      </h2>
                      <p className="mt-1 text-sm text-fg-muted">{plan.description}</p>
                    </div>
                    <p className="text-right">
                      <span className="block text-2xl font-semibold text-fg tabular-nums">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-xs text-fg-muted">
                        {plan.billing === "monthly"
                          ? copy.pricing.perMonth
                          : plan.entries && plan.validityDays
                            ? copy.pricing.pack(plan.entries, plan.validityDays)
                            : ""}
                      </span>
                    </p>
                  </div>
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm text-fg">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex gap-2">
                        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <span className="text-sm text-fg-muted">{t.members(count)}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-fg">
                        <Switch
                          checked={plan.active}
                          aria-label={t.toggle(plan.name)}
                          onCheckedChange={(active) => {
                            updatePlan(plan.id, { active });
                            toast.success(active ? t.active : t.inactive, {
                              description: plan.name,
                            });
                          }}
                        />
                        <span aria-hidden>{plan.active ? t.active : t.inactive}</span>
                      </label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDialog({ type: "plan", id: plan.id })}
                      >
                        <Pencil aria-hidden />
                        {copy.common.edit}
                        <span className="sr-only"> · {plan.name}</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
