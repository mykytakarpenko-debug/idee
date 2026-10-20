"use client";

import { useId } from "react";
import { copy } from "@/content/it";
import { useZodForm } from "@/hooks/use-zod-form";
import { centsToInput } from "@/lib/format";
import { serviceFormSchema, type ServiceFormValues } from "@/lib/domain/schemas";
import type { Service } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, ToggleRow } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.services.form;

function toValues(service?: Service): ServiceFormValues {
  return {
    name: service?.name ?? "",
    category: service?.category ?? "",
    durationMin: String(service?.durationMin ?? 60),
    price: service ? centsToInput(service.price) : "",
    description: service?.description ?? "",
    active: service?.active ?? true,
  };
}

export function ServiceFormDialog({ id, onDone }: { id?: string; onDone: () => void }) {
  const service = useDataStore((state) =>
    id ? state.services.find((s) => s.id === id) : undefined,
  );
  const services = useDataStore((state) => state.services);
  const createService = useDataStore((state) => state.createService);
  const updateService = useDataStore((state) => state.updateService);
  const form = useZodForm(serviceFormSchema, toValues(service));
  const { errors, text } = form;
  const listId = useId();
  const categories = [...new Set(services.map((s) => s.category))].sort((a, b) =>
    a.localeCompare(b, "it"),
  );

  const onSubmit = form.handleSubmit((data) => {
    const input = { ...data, description: data.description || undefined };
    if (service) {
      updateService(service.id, input);
      toast.success(t.updated);
    } else {
      createService(input);
      toast.success(t.created);
    }
    onDone();
  });

  return (
    <DialogContent title={service ? t.editTitle : t.createTitle}>
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <Field label={t.name} name="name" error={errors.name} className="sm:col-span-2">
            {(props) => <Input {...props} {...text("name")} />}
          </Field>
          <Field
            label={t.category}
            name="category"
            error={errors.category}
            hint={t.categoryHint}
            className="sm:col-span-2"
          >
            {(props) => <Input {...props} {...text("category")} list={listId} autoComplete="off" />}
          </Field>
          <datalist id={listId}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <Field label={t.duration} name="durationMin" error={errors.durationMin}>
            {(props) => (
              <Input
                {...props}
                {...text("durationMin")}
                type="number"
                inputMode="numeric"
                min={5}
                max={600}
                step={5}
              />
            )}
          </Field>
          <Field label={t.price} name="price" error={errors.price}>
            {(props) => (
              <Input {...props} {...text("price")} inputMode="decimal" placeholder="0,00" />
            )}
          </Field>
          <Field
            label={t.description}
            name="description"
            error={errors.description}
            optional
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} {...text("description")} rows={2} />}
          </Field>
          <ToggleRow
            className="sm:col-span-2"
            label={t.active}
            description={t.activeHint}
            control={({ labelId, descriptionId }) => (
              <Switch
                checked={form.values.active}
                onCheckedChange={(checked) => form.setValue("active", checked)}
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
              />
            )}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{service ? copy.common.saveChanges : copy.services.new}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
