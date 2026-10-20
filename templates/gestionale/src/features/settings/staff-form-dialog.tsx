"use client";

import { Check } from "lucide-react";
import { copy } from "@/content/it";
import { useZodForm } from "@/hooks/use-zod-form";
import { staffFormSchema, type StaffFormValues } from "@/lib/domain/schemas";
import type { ColorSlot, StaffMember } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, ToggleRow } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

const t = copy.settings.team;
const SLOTS: ColorSlot[] = [1, 2, 3, 4, 5, 6, 7, 8];

function toValues(member: StaffMember | undefined, nextColor: ColorSlot): StaffFormValues {
  return {
    name: member?.name ?? "",
    role: member?.role ?? "",
    email: member?.email ?? "",
    color: String(member?.color ?? nextColor) as StaffFormValues["color"],
    active: member?.active ?? true,
  };
}

export function StaffFormDialog({ id, onDone }: { id?: string; onDone: () => void }) {
  const staff = useDataStore((state) => state.staff);
  const member = staff.find((m) => m.id === id);
  const createStaff = useDataStore((state) => state.createStaff);
  const updateStaff = useDataStore((state) => state.updateStaff);
  const used = new Set(staff.map((m) => m.color));
  const nextColor = SLOTS.find((slot) => !used.has(slot)) ?? 1;
  const form = useZodForm(staffFormSchema, toValues(member, nextColor));
  const { errors, text, values } = form;

  const onSubmit = form.handleSubmit((data) => {
    const input = { ...data, color: Number(data.color) as ColorSlot };
    if (member) updateStaff(member.id, input);
    else createStaff(input);
    toast.success(t.saved);
    onDone();
  });

  return (
    <DialogContent title={member ? t.edit : t.add}>
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="grid gap-4">
          <Field label={t.name} name="name" error={errors.name}>
            {(props) => <Input {...props} {...text("name")} autoComplete="name" />}
          </Field>
          <Field label={t.role} name="role" error={errors.role}>
            {(props) => <Input {...props} {...text("role")} />}
          </Field>
          <Field label={t.email} name="email" error={errors.email} optional>
            {(props) => <Input {...props} {...text("email")} type="email" autoComplete="email" />}
          </Field>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-fg">{t.color}</legend>
            <div className="flex flex-wrap gap-2.5">
              {SLOTS.map((slot) => {
                const checked = values.color === String(slot);
                return (
                  <label key={slot} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={slot}
                      checked={checked}
                      onChange={() =>
                        form.setValue("color", String(slot) as StaffFormValues["color"])
                      }
                      className="peer sr-only"
                    />
                    <span className="sr-only">{copy.colors[slot - 1]}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-shadow peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
                        checked && "ring-2 ring-fg",
                      )}
                      style={{ backgroundColor: `var(--series-${slot})` }}
                    >
                      {checked ? <Check className="size-4 text-white" strokeWidth={3} /> : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <ToggleRow
            label={t.active}
            control={({ labelId }) => (
              <Switch
                checked={values.active}
                onCheckedChange={(checked) => form.setValue("active", checked)}
                aria-labelledby={labelId}
              />
            )}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{copy.common.save}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
