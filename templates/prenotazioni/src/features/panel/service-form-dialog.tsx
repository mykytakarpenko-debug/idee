"use client";

import { copy } from "@/content/it";
import { useData } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { serviceFormSchema, type ServiceFormValues } from "@/lib/domain/schemas";
import type { Mode, Service } from "@/lib/domain/types";
import { centsToInput } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const f = copy.services.form;
const MODES: Mode[] = ["in_person", "online"];

function toValues(service: Service | undefined, categoryId: string): ServiceFormValues {
  return {
    name: service?.name ?? "",
    description: service?.description ?? "",
    categoryId: service?.categoryId ?? categoryId,
    durationMin: String(service?.durationMin ?? 45),
    bufferMin: String(service?.bufferMin ?? 10),
    price: service?.price != null ? centsToInput(service.price) : "",
    modes: service?.modes ?? ["in_person"],
    staffIds: service?.staffIds ?? [],
    requiresApproval: service?.requiresApproval ?? false,
  };
}

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

export function ServiceFormDialog({ id, onDone }: { id?: string; onDone: () => void }) {
  const { service, categories, staff } = useData((state) => ({
    service: id ? state.services.find((s) => s.id === id) : undefined,
    categories: state.categories,
    staff: state.staff,
  }));
  const createService = useDataStore((state) => state.createService);
  const updateService = useDataStore((state) => state.updateService);
  const form = useZodForm(serviceFormSchema, toValues(service, categories[0]?.id ?? ""));
  const { values, errors, text, setValue } = form;

  const onSubmit = form.handleSubmit((data) => {
    if (service) {
      updateService(service.id, data);
      toast.success(f.updated);
    } else {
      createService(data);
      toast.success(f.created);
    }
    onDone();
  });

  return (
    <DialogContent title={service ? f.editTitle : f.createTitle} size="lg">
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4 sm:grid-cols-2">
          <Field label={f.name} name="name" error={errors.name} className="sm:col-span-2">
            {(props) => <Input {...props} {...text("name")} />}
          </Field>
          <Field
            label={f.description}
            name="description"
            error={errors.description}
            className="sm:col-span-2"
          >
            {(props) => <Textarea {...props} {...text("description")} rows={2} />}
          </Field>
          <Field label={f.category} name="categoryId" error={errors.categoryId}>
            {(props) => (
              <Select {...props} {...text("categoryId")}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={f.price} name="price" error={errors.price} hint={f.priceHint} optional>
            {(props) => (
              <Input {...props} {...text("price")} inputMode="decimal" placeholder="0,00" />
            )}
          </Field>
          <Field label={f.duration} name="durationMin" error={errors.durationMin}>
            {(props) => (
              <Input
                {...props}
                {...text("durationMin")}
                type="number"
                inputMode="numeric"
                min={10}
                step={5}
              />
            )}
          </Field>
          <Field label={f.buffer} name="bufferMin" error={errors.bufferMin} hint={f.bufferHint}>
            {(props) => (
              <Input
                {...props}
                {...text("bufferMin")}
                type="number"
                inputMode="numeric"
                min={0}
                step={5}
              />
            )}
          </Field>
          <fieldset aria-describedby={errors.modes ? "modes-error" : undefined}>
            <legend className="text-[13px] font-medium text-fg">{f.modes}</legend>
            <div className="mt-2 flex flex-col gap-2">
              {MODES.map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm text-fg">
                  <Checkbox
                    checked={values.modes.includes(mode)}
                    onChange={() => setValue("modes", toggle(values.modes, mode))}
                  />
                  {copy.modes[mode]}
                </label>
              ))}
            </div>
            {errors.modes ? (
              <p id="modes-error" className="mt-1 text-[13px] text-danger">
                {errors.modes}
              </p>
            ) : null}
          </fieldset>
          <fieldset aria-describedby={errors.staffIds ? "staff-error" : undefined}>
            <legend className="text-[13px] font-medium text-fg">{f.staff}</legend>
            <div className="mt-2 flex flex-col gap-2">
              {staff.map((person) => (
                <label key={person.id} className="flex items-center gap-2 text-sm text-fg">
                  <Checkbox
                    checked={values.staffIds.includes(person.id)}
                    onChange={() => setValue("staffIds", toggle(values.staffIds, person.id))}
                  />
                  {person.name}
                </label>
              ))}
            </div>
            {errors.staffIds ? (
              <p id="staff-error" className="mt-1 text-[13px] text-danger">
                {errors.staffIds}
              </p>
            ) : null}
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-fg sm:col-span-2">
            <Checkbox
              checked={values.requiresApproval}
              onChange={(event) => setValue("requiresApproval", event.target.checked)}
            />
            {f.approval}
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">
            {service ? copy.common.saveChanges : copy.services.newService}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
