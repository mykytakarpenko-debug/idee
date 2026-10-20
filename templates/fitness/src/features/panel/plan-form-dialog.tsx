"use client";

import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { planFormSchema, type PlanFormValues } from "@/lib/domain/schemas";
import type { Plan } from "@/lib/domain/types";
import { centsToInput } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const f = copy.plans.form;

function toValues(plan: Plan | undefined): PlanFormValues {
  return {
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    billing: plan?.billing ?? "monthly",
    price: plan ? centsToInput(plan.price) : "",
    entries: plan?.entries ? String(plan.entries) : "10",
    validityDays: plan?.validityDays ? String(plan.validityDays) : "90",
    includesGym: plan?.includesGym ?? true,
    includesClasses: plan?.includesClasses ?? true,
    featured: plan?.featured ?? false,
    perks: plan?.perks.join("\n") ?? "",
  };
}

export function PlanFormDialog({ id, onDone }: { id?: string; onDone: () => void }) {
  const plan = useData((state) => (id ? state.plans.find((p) => p.id === id) : undefined));
  const createPlan = useDataStore((state) => state.createPlan);
  const updatePlan = useDataStore((state) => state.updatePlan);
  const form = useZodForm(planFormSchema, toValues(plan));
  const { values, errors, text, setValue } = form;
  const pack = values.billing === "pack";

  const onSubmit = form.handleSubmit((data) => {
    const input = {
      name: data.name,
      description: data.description,
      billing: data.billing,
      price: data.price,
      entries: data.billing === "pack" ? Number.parseInt(data.entries, 10) : null,
      validityDays: data.billing === "pack" ? Number.parseInt(data.validityDays, 10) : null,
      includesGym: data.includesGym,
      includesClasses: data.includesClasses,
      featured: data.featured,
      perks: data.perks
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
    if (plan) {
      updatePlan(plan.id, input);
      toast.success(f.updated);
    } else {
      createPlan(input);
      toast.success(f.created);
    }
    onDone();
  });

  return (
    <DialogContent title={plan ? f.editTitle : f.createTitle} size="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <Field label={f.name} name="name" error={errors.name}>
            {(props) => <Input {...props} {...text("name")} />}
          </Field>
          <Field label={f.billing} name="billing" error={errors.billing}>
            {(props) => (
              <Select {...props} {...text("billing")}>
                <option value="monthly">{copy.plans.monthly}</option>
                <option value="pack">{copy.plans.pack}</option>
              </Select>
            )}
          </Field>
          <Field
            label={f.description}
            name="description"
            error={errors.description}
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} {...text("description")} rows={2} />}
          </Field>
          <Field label={f.price} name="price" error={errors.price} hint={f.priceHint}>
            {(props) => (
              <Input {...props} {...text("price")} inputMode="decimal" placeholder="0,00" />
            )}
          </Field>
          {pack ? (
            <div className="grid grid-cols-2 gap-4">
              <Field label={f.entries} name="entries" error={errors.entries}>
                {(props) => (
                  <Input
                    {...props}
                    {...text("entries")}
                    type="number"
                    inputMode="numeric"
                    min={1}
                  />
                )}
              </Field>
              <Field label={f.validity} name="validityDays" error={errors.validityDays}>
                {(props) => (
                  <Input
                    {...props}
                    {...text("validityDays")}
                    type="number"
                    inputMode="numeric"
                    min={1}
                  />
                )}
              </Field>
            </div>
          ) : (
            <div />
          )}
          <Field
            label={f.perks}
            name="perks"
            error={errors.perks}
            optional
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} {...text("perks")} rows={4} />}
          </Field>
          <div className="flex flex-col gap-2 sm:col-span-2">
            {(
              [
                ["includesGym", f.gym],
                ["includesClasses", f.classes],
                ["featured", f.featured],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-fg">
                <Checkbox
                  checked={values[key]}
                  onChange={(event) => setValue(key, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{plan ? copy.common.saveChanges : copy.plans.newPlan}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
